import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; perPage?: number }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
    const skip = (page - 1) * perPage;
    const where = { tenants: { some: { tenantId } }, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: perPage, select: { id: true, email: true, firstName: true, lastName: true, status: true, lastLoginAt: true, tenants: { where: { tenantId }, include: { role: true } } } }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenants: { some: { tenantId } }, deletedAt: null },
      include: { tenants: { where: { tenantId }, include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async invite(tenantId: string, dto: { email: string; roleId: string }, senderId: string) {
    const { randomUUID } = await import('crypto');
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    return this.prisma.invite.create({ data: { tenantId, email: dto.email, roleId: dto.roleId, senderId, token, expiresAt } });
  }

  async listInvites(tenantId: string) {
    const now = new Date();
    const invites = await this.prisma.invite.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    return { data: invites };
  }

  async deleteInvite(tenantId: string, id: string) {
    const invite = await this.prisma.invite.findFirst({ where: { id, tenantId } });
    if (!invite) throw new NotFoundException('Invite not found');
    await this.prisma.invite.delete({ where: { id } });
    return { deleted: true };
  }

  async updateUserRole(tenantId: string, userId: string, dto: { roleId: string }) {
    const userTenant = await this.prisma.userTenant.findFirst({
      where: { userId, tenantId },
    });
    if (!userTenant) throw new NotFoundException('User not found in this tenant');

    return this.prisma.userTenant.update({
      where: { id: userTenant.id },
      data: { roleId: dto.roleId },
      include: { role: true },
    });
  }
}
