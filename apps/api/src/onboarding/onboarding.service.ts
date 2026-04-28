import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateWhiteLabelOnboardingDto } from './dto/create-white-label-onboarding.dto';
import {
  PROVISIONING_STATUS,
  REVELATOR_ENTITY_TYPES,
  REVELATOR_PROVIDER,
  type ProvisioningStatus,
} from './onboarding.constants';
import { RevelatorAccountService } from './revelator-account.service';

interface LocalProvisioningContext {
  tenant: { id: string; slug: string; name: string };
  user: { id: string; email: string };
  connection: { id: string };
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revelatorAccount: RevelatorAccountService,
    private readonly jwt: JwtService,
  ) {}

  async createWhiteLabelTenant(dto: CreateWhiteLabelOnboardingDto) {
    await this.assertUniqueTenantAndUser(dto.tenantSlug, dto.ownerEmail);

    const role = await this.prisma.role.findFirst({
      where: { slug: 'label_owner', tenantId: null },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('label_owner role not found');

    const passwordHash = await hash(dto.password, 12);
    const accountType = dto.accountType ?? 'label';

    const local = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
          status: 'SETUP',
          plan: 'WHITE_LABEL',
          branding: dto.primaryColor
            ? {
                create: {
                  primaryColor: dto.primaryColor,
                },
              }
            : undefined,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          passwordHash,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userTenant.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: role.id,
          isOwner: true,
        },
      });

      const connection = await tx.integrationConnection.create({
        data: {
          tenantId: tenant.id,
          provider: REVELATOR_PROVIDER,
          environment: this.providerEnvironment(),
          enabled: false,
          config: {
            accountType,
            partnerUserId: user.id,
            whiteLabelUrl: process.env['REVELATOR_WHITE_LABEL_URL'],
            provisioningStatus: PROVISIONING_STATUS.provisioningRevelator,
          },
        },
      });

      return { tenant, user, connection };
    });

    const provisioningStatus = await this.provisionRevelator(local, {
      tenantName: dto.tenantName,
      ownerEmail: dto.ownerEmail,
      ownerFirstName: dto.ownerFirstName,
      ownerLastName: dto.ownerLastName,
      accountType,
    });

    const tokens = await this.generateTokens({
      id: local.user.id,
      email: local.user.email,
      tenantId: local.tenant.id,
      roleSlug: 'label_owner',
      permissions: role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`,
      ),
    });

    return {
      tenant: {
        id: local.tenant.id,
        slug: local.tenant.slug,
        name: local.tenant.name,
      },
      user: {
        id: local.user.id,
        email: local.user.email,
      },
      tokens,
      provisioningStatus,
    };
  }

  async getStatus(tenantId: string) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: { tenantId, provider: REVELATOR_PROVIDER },
      orderBy: { updatedAt: 'desc' },
    });

    if (!connection) {
      return {
        connected: false,
        provisioningStatus: PROVISIONING_STATUS.pendingLocal,
        lastProvisioningError: null,
      };
    }

    const config = (connection.config ?? {}) as Record<string, unknown>;

    return {
      connected: connection.enabled,
      provisioningStatus: config['provisioningStatus'] ?? PROVISIONING_STATUS.pendingLocal,
      lastProvisioningError: config['lastProvisioningError'] ?? null,
    };
  }

  private async assertUniqueTenantAndUser(slug: string, email: string) {
    const [tenant, user] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug } }),
      this.prisma.user.findUnique({ where: { email } }),
    ]);

    if (tenant) throw new ConflictException('Tenant slug already exists');
    if (user) throw new ConflictException('Owner email already exists');
  }

  private async provisionRevelator(
    local: LocalProvisioningContext,
    input: {
      tenantName: string;
      ownerEmail: string;
      ownerFirstName?: string;
      ownerLastName?: string;
      accountType: string;
    },
  ): Promise<ProvisioningStatus> {
    try {
      const result = await this.revelatorAccount.signupChildAccount({
        tenantName: input.tenantName,
        ownerEmail: input.ownerEmail,
        ownerFirstName: input.ownerFirstName,
        ownerLastName: input.ownerLastName,
        partnerUserId: local.user.id,
        accountType: input.accountType,
      });

      await this.prisma.integrationConnection.update({
        where: { id: local.connection.id },
        data: {
          enabled: true,
          config: {
            enterpriseId: result.enterpriseId,
            revelatorUserId: result.revelatorUserId,
            partnerUserId: local.user.id,
            accountType: input.accountType,
            whiteLabelUrl: process.env['REVELATOR_WHITE_LABEL_URL'],
            provisioningStatus: PROVISIONING_STATUS.active,
          },
        },
      });

      await this.prisma.externalMapping.createMany({
        data: [
          {
            tenantId: local.tenant.id,
            connectionId: local.connection.id,
            entityType: REVELATOR_ENTITY_TYPES.tenant,
            provider: REVELATOR_PROVIDER,
            environment: this.providerEnvironment(),
            externalId: result.enterpriseId,
            externalReference: result.enterpriseId,
            syncStatus: 'SYNCED',
            idempotencyKey: `${REVELATOR_PROVIDER}:${this.providerEnvironment()}:tenant:${local.tenant.id}`,
          },
          {
            tenantId: local.tenant.id,
            connectionId: local.connection.id,
            entityType: REVELATOR_ENTITY_TYPES.user,
            provider: REVELATOR_PROVIDER,
            environment: this.providerEnvironment(),
            externalId: result.revelatorUserId,
            externalReference: result.email,
            syncStatus: 'SYNCED',
            idempotencyKey: `${REVELATOR_PROVIDER}:${this.providerEnvironment()}:user:${local.user.id}`,
          },
        ],
        skipDuplicates: true,
      });

      await this.prisma.tenant.update({
        where: { id: local.tenant.id },
        data: { status: 'ACTIVE' },
      });

      return PROVISIONING_STATUS.active;
    } catch (error) {
      const classified = this.revelatorAccount.classifyError(error);
      const provisioningStatus = classified.retryable
        ? PROVISIONING_STATUS.failedRetryable
        : PROVISIONING_STATUS.failedManualReview;

      await this.prisma.integrationConnection.update({
        where: { id: local.connection.id },
        data: {
          enabled: false,
          config: {
            partnerUserId: local.user.id,
            whiteLabelUrl: process.env['REVELATOR_WHITE_LABEL_URL'],
            provisioningStatus,
            lastProvisioningError: classified.message,
          },
        },
      });

      return provisioningStatus;
    }
  }

  private providerEnvironment(): 'SANDBOX' | 'PRODUCTION' {
    return process.env['REVELATOR_ENVIRONMENT'] === 'production' ? 'PRODUCTION' : 'SANDBOX';
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    tenantId: string;
    roleSlug: string;
    permissions: string[];
  }) {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleSlug: user.roleSlug,
      permissions: user.permissions,
    });

    const refreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, expiresAt: expiresAt.toISOString() };
  }
}
