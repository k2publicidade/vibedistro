import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; perPage?: number }) {
    const { page = 1, perPage = 20 } = query;
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
}
