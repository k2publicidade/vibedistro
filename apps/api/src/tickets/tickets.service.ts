import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; perPage?: number; status?: string; priority?: string }) {
    const { status, priority } = query;
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
    };

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        createdBy: t.createdBy,
        assignedToId: t.assignedToId,
        messageCount: t._count.messages,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(tenantId: string, dto: { subject: string; priority?: string; description: string }, createdById: string) {
    return this.prisma.ticket.create({
      data: {
        tenantId,
        createdById,
        subject: dto.subject,
        priority: (dto.priority as any) ?? 'MEDIUM',
        messages: {
          create: {
            authorId: createdById,
            body: dto.description,
          },
        },
      },
      include: {
        messages: { include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: { status?: string; priority?: string; assignedToId?: string }) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const data: Record<string, any> = {};
    if (dto.status) data.status = dto.status;
    if (dto.priority) data.priority = dto.priority;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;

    if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
    if (dto.status === 'CLOSED') data.closedAt = new Date();

    return this.prisma.ticket.update({ where: { id }, data });
  }

  async addMessage(tenantId: string, ticketId: string, dto: { body: string; isInternal?: boolean }, authorId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId, deletedAt: null } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
      },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }
}
