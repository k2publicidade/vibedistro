import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; perPage?: number; search?: string }) {
    const { page = 1, perPage = 20, search } = query;
    const skip = (page - 1) * perPage;
    const where = {
      deletedAt: null,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, skip, take: perPage, include: { branding: true } }),
      this.prisma.tenant.count({ where }),
    ]);
    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: { branding: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null }, include: { branding: true } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: { name: string; slug: string; plan?: string; ownerId?: string }) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');
    return this.prisma.tenant.create({ data: dto as any });
  }

  async update(id: string, dto: Record<string, unknown>) {
    await this.findOne(id);
    const { branding, ...rest } = dto as any;
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        ...(branding && { branding: { upsert: { create: branding, update: branding } } }),
      },
      include: { branding: true },
    });
  }
}
