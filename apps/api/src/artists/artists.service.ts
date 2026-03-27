import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { CreateArtistDto, UpdateArtistDto } from '@vibedistro/types';
import type { PaginationQuery } from '@vibedistro/types';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationQuery) {
    const { page = 1, perPage = 20, search, sortBy = 'stageName', sortOrder = 'asc' } = query;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { stageName: { contains: search, mode: 'insensitive' as const } },
          { legalName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.artist.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.artist.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const artist = await this.prisma.artist.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { tags: { include: { tag: true } } },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async create(tenantId: string, dto: CreateArtistDto, createdBy: string) {
    return this.prisma.artist.create({
      data: {
        tenantId,
        createdBy,
        ...dto,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateArtistDto, updatedBy: string) {
    await this.findOne(tenantId, id);
    return this.prisma.artist.update({
      where: { id },
      data: { ...dto, updatedBy },
    });
  }

  async remove(tenantId: string, id: string, deletedBy: string) {
    await this.findOne(tenantId, id);
    // Soft delete
    return this.prisma.artist.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}
