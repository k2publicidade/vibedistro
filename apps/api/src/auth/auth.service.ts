import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service.js';
import type { SessionUser, AuthTokens, LoginDto, RegisterDto } from '@vibedistro/types';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleSlug: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user?.passwordHash) return null;

    const valid = await compare(password, user.passwordHash);
    if (!valid) return null;

    return null; // Tenant context needed — resolved in login()
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
    user: SessionUser;
    tokens: AuthTokens;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    // Resolve tenant
    const tenantFilter = dto.tenantSlug
      ? { tenant: { slug: dto.tenantSlug } }
      : {};

    const userTenant = await this.prisma.userTenant.findFirst({
      where: { userId: user.id, ...tenantFilter },
      include: {
        tenant: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!userTenant) throw new UnauthorizedException('No access to this tenant');

    const permissions = userTenant.role.permissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`,
    );

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      tenantId: userTenant.tenantId,
      roleSlug: userTenant.role.slug,
      permissions,
    };

    const tokens = await this.generateTokens(sessionUser, userTenant.tenantId);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    this.logger.log(`Login: ${user.email} → tenant ${userTenant.tenantId}`);
    return { user: sessionUser, tokens };
  }

  async register(dto: RegisterDto): Promise<{ user: SessionUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    let tenantId: string | null = null;

    if (dto.inviteToken) {
      const invite = await this.prisma.invite.findUnique({
        where: { token: dto.inviteToken },
      });
      if (!invite || invite.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired invite token');
      }
      tenantId = invite.tenantId;
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.inviteToken ? 'ACTIVE' : 'PENDING_VERIFICATION',
        emailVerifiedAt: dto.inviteToken ? new Date() : null,
      },
    });

    if (tenantId && dto.inviteToken) {
      const invite = await this.prisma.invite.findUnique({ where: { token: dto.inviteToken } });
      if (invite) {
        await this.prisma.userTenant.create({
          data: { userId: user.id, tenantId, roleId: invite.roleId },
        });
        await this.prisma.invite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date(), acceptedBy: user.id },
        });
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      tenantId: tenantId ?? '',
      roleSlug: 'artist',
      permissions: [],
    };

    const tokens = await this.generateTokens(sessionUser, tenantId ?? '');
    return { user: sessionUser, tokens };
  }

  async refreshTokens(token: string): Promise<AuthTokens> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: token } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
    const userTenant = await this.prisma.userTenant.findFirst({
      where: { userId: user.id, tenantId: record.tenantId ?? '' },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!userTenant) throw new UnauthorizedException();

    const permissions = userTenant.role.permissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`,
    );

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      tenantId: userTenant.tenantId,
      roleSlug: userTenant.role.slug,
      permissions,
    };

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(sessionUser, userTenant.tenantId);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(user: SessionUser, tenantId: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId,
      roleSlug: user.roleSlug,
      permissions: user.permissions,
    };

    const accessToken = this.jwt.sign(payload);

    const refreshTokenValue = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000); // 30d

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId,
        tokenHash: refreshTokenValue,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
