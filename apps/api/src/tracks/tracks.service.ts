import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TracksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, q: any) {
    const page = Number(q.page) || 1;
    const perPage = Number(q.perPage) || 20;
    const skip = (page - 1) * perPage;
    const where = { tenantId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.track.findMany({ where, skip, take: perPage }),
      this.prisma.track.count({ where }),
    ]);
    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findOne(tenantId: string, id: string) {
    const t = await this.prisma.track.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { contributors: true },
    });
    if (!t) throw new NotFoundException('Track not found');
    return t;
  }

  async create(tenantId: string, dto: any, createdBy: string) {
    // Auto-generate ISRC if not provided
    if (!dto.isrc) {
      dto.isrc = await this.generateIsrc(tenantId);
    }
    return this.prisma.track.create({ data: { tenantId, createdBy, ...dto } });
  }

  async update(tenantId: string, id: string, dto: any, updatedBy: string) {
    await this.findOne(tenantId, id);
    return this.prisma.track.update({ where: { id }, data: { ...dto, updatedBy } });
  }

  private async generateIsrc(tenantId: string): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await this.prisma.track.count({ where: { tenantId } });
    const seq = (count + 1).toString().padStart(5, '0');
    return `BR-VBD-${year}-${seq}`;
  }
}
