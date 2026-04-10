import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, q: string) {
    if (!q || q.trim().length === 0) {
      return { artists: [], releases: [], tracks: [], tickets: [] };
    }

    const term = q.trim();
    const limit = 5;

    const [artists, releases, tracks, tickets] = await Promise.all([
      this.prisma.artist.findMany({
        where: {
          tenantId,
          deletedAt: null,
          stageName: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, stageName: true, avatarUrl: true },
        take: limit,
      }),
      this.prisma.release.findMany({
        where: {
          tenantId,
          deletedAt: null,
          title: { contains: term, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          status: true,
          artist: { select: { stageName: true } },
          coverAsset: { select: { cdnUrl: true } },
        },
        take: limit,
      }),
      this.prisma.track.findMany({
        where: {
          tenantId,
          deletedAt: null,
          title: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, title: true, isrc: true },
        take: limit,
      }),
      this.prisma.ticket.findMany({
        where: {
          tenantId,
          deletedAt: null,
          subject: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, subject: true, status: true, priority: true },
        take: limit,
      }),
    ]);

    return { artists, releases, tracks, tickets };
  }
}
