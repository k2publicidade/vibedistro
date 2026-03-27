import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
@Injectable()
export class TracksService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(tenantId: string, q: any) {
    const { page=1,perPage=20 } = q; const skip=(page-1)*perPage;
    const where = { tenantId, deletedAt: null };
    const [data,total] = await Promise.all([this.prisma.track.findMany({where,skip,take:perPage}),this.prisma.track.count({where})]);
    return { data, meta:{total,page,perPage,totalPages:Math.ceil(total/perPage)} };
  }
  async findOne(tenantId: string, id: string) {
    const t = await this.prisma.track.findFirst({ where:{id,tenantId,deletedAt:null}, include:{contributors:true} });
    if (!t) throw new NotFoundException('Track not found');
    return t;
  }
  async create(tenantId: string, dto: any, createdBy: string) { return this.prisma.track.create({data:{tenantId,createdBy,...dto}}); }
  async update(tenantId: string, id: string, dto: any, updatedBy: string) { await this.findOne(tenantId,id); return this.prisma.track.update({where:{id},data:{...dto,updatedBy}}); }
}
