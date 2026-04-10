import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: {
      page?: number;
      perPage?: number;
      action?: string;
      entityType?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const { action, entityType, userId, dateFrom, dateTo } = query;
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ...(action && { action }),
      ...(entityType && { resource: entityType }),
      ...(userId && { actorId: userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getDistinctActions(tenantId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    return { data: logs.map((l) => l.action) };
  }
}
