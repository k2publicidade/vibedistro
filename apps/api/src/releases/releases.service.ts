import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { PaginationQuery, ReleaseStatus } from '@vibedistro/types';

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<ReleaseStatus, ReleaseStatus[]>> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  APPROVED: ['SCHEDULED', 'SUBMITTED'],
  SCHEDULED: ['SUBMITTED'],
  SUBMITTED: ['DELIVERED'],
  DELIVERED: ['LIVE'],
  LIVE: ['TAKEDOWN_REQUESTED'],
  TAKEDOWN_REQUESTED: ['TAKEN_DOWN'],
};

@Injectable()
export class ReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationQuery & { status?: string; artistId?: string }) {
    const { page = 1, perPage = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, artistId } = query;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(artistId && { artistId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { upc: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.release.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
        include: { artist: { select: { stageName: true } }, coverAsset: { select: { cdnUrl: true } } },
      }),
      this.prisma.release.count({ where }),
    ]);

    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async findOne(tenantId: string, id: string) {
    const release = await this.prisma.release.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        artist: true,
        releaseTracks: { include: { track: { include: { contributors: true } } }, orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }] },
        dspProfiles: true,
        countryRestrictions: true,
        externalMappings: true,
        approvalFlow: { include: { steps: true } },
      },
    });
    if (!release) throw new NotFoundException('Release not found');
    return release;
  }

  async create(tenantId: string, dto: Record<string, unknown>, createdBy: string) {
    return this.prisma.release.create({
      data: { tenantId, createdBy, status: 'DRAFT', ...(dto as any) },
    });
  }

  async update(tenantId: string, id: string, dto: Record<string, unknown>, updatedBy: string) {
    const release = await this.findOne(tenantId, id);
    if (['LIVE', 'TAKEN_DOWN', 'ARCHIVED'].includes(release.status)) {
      throw new BadRequestException(`Cannot edit release in status ${release.status}`);
    }
    return this.prisma.release.update({ where: { id }, data: { ...(dto as any), updatedBy } });
  }

  async transitionStatus(tenantId: string, id: string, newStatus: ReleaseStatus, userId: string) {
    const release = await this.findOne(tenantId, id);
    const allowed = ALLOWED_STATUS_TRANSITIONS[release.status as ReleaseStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${release.status} to ${newStatus}`);
    }

    const updated = await this.prisma.release.update({
      where: { id },
      data: { status: newStatus, updatedBy: userId },
    });

    // Audit
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorId: userId,
        action: 'release.status_changed',
        resource: 'Release',
        resourceId: id,
        before: { status: release.status },
        after: { status: newStatus },
      },
    });

    return updated;
  }

  async remove(tenantId: string, id: string, userId: string) {
    const release = await this.findOne(tenantId, id);
    if (release.status === 'LIVE') {
      throw new BadRequestException('Cannot delete a live release. Request takedown first.');
    }
    return this.prisma.release.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
