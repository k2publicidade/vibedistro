import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type Period = '7d' | '30d' | '90d' | '1y';

function periodToDays(period: Period): number {
  const map: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  return map[period] ?? 30;
}

function dateRangeFromPeriod(period: Period) {
  const days = periodToDays(period);
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to: now, prevFrom, prevTo: from };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string, period: Period) {
    const { from, to, prevFrom, prevTo } = dateRangeFromPeriod(period);

    const [current, previous, activeArtists, liveReleases, prevActiveArtists, prevLiveReleases] =
      await Promise.all([
        this.prisma.royaltyEntry.aggregate({
          where: { tenantId, createdAt: { gte: from, lte: to } },
          _sum: { streams: true, grossRevenueCents: true },
        }),
        this.prisma.royaltyEntry.aggregate({
          where: { tenantId, createdAt: { gte: prevFrom, lte: prevTo } },
          _sum: { streams: true, grossRevenueCents: true },
        }),
        this.prisma.royaltyEntry.findMany({
          where: { tenantId, createdAt: { gte: from, lte: to }, trackIsrc: { not: null } },
          distinct: ['trackIsrc'],
          select: { trackIsrc: true },
        }).then(async (entries) => {
          if (entries.length === 0) return 0;
          const isrcs = entries.map((e) => e.trackIsrc).filter(Boolean) as string[];
          const tracks = await this.prisma.track.findMany({
            where: { isrc: { in: isrcs }, tenantId },
            select: { id: true },
            distinct: ['id'],
          });
          const releaseTracks = await this.prisma.releaseTrack.findMany({
            where: { trackId: { in: tracks.map((t) => t.id) } },
            select: { release: { select: { artistId: true } } },
            distinct: ['releaseId'],
          });
          const uniqueArtists = new Set(releaseTracks.map((rt) => rt.release.artistId));
          return uniqueArtists.size;
        }),
        this.prisma.release.count({ where: { tenantId, status: 'LIVE', deletedAt: null } }),
        // Previous period artists — simplified count
        this.prisma.artist.count({ where: { tenantId, deletedAt: null } }),
        this.prisma.release.count({
          where: { tenantId, status: 'LIVE', deletedAt: null, liveSince: { lte: prevTo } },
        }),
      ]);

    const totalStreams = Number(current._sum.streams ?? 0);
    const totalRevenue = Number(current._sum.grossRevenueCents ?? 0);
    const prevStreams = Number(previous._sum.streams ?? 0);
    const prevRevenue = Number(previous._sum.grossRevenueCents ?? 0);

    const calcDelta = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 10000) / 100;

    return {
      totalStreams,
      totalRevenue,
      totalArtists: activeArtists || prevActiveArtists,
      totalReleases: liveReleases,
      deltas: {
        streams: calcDelta(totalStreams, prevStreams),
        revenue: calcDelta(totalRevenue, prevRevenue),
        artists: calcDelta(activeArtists, prevActiveArtists),
        releases: calcDelta(liveReleases, prevLiveReleases),
      },
      period,
    };
  }

  async getStreams(tenantId: string, query: { period?: Period; artistId?: string; releaseId?: string }) {
    const { period = '30d', artistId, releaseId } = query;
    const { from, to } = dateRangeFromPeriod(period as Period);

    // Build optional ISRC filter from artistId or releaseId
    let isrcFilter: string[] | undefined;

    if (releaseId) {
      const releaseTracks = await this.prisma.releaseTrack.findMany({
        where: { releaseId },
        include: { track: { select: { isrc: true } } },
      });
      isrcFilter = releaseTracks.map((rt) => rt.track.isrc).filter(Boolean) as string[];
    } else if (artistId) {
      const releases = await this.prisma.release.findMany({
        where: { artistId, tenantId },
        select: { id: true },
      });
      const releaseTracks = await this.prisma.releaseTrack.findMany({
        where: { releaseId: { in: releases.map((r) => r.id) } },
        include: { track: { select: { isrc: true } } },
      });
      isrcFilter = releaseTracks.map((rt) => rt.track.isrc).filter(Boolean) as string[];
    }

    const entries = await this.prisma.royaltyEntry.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
        ...(isrcFilter && { trackIsrc: { in: isrcFilter } }),
      },
      select: { period: true, streams: true },
    });

    // Group by period
    const grouped = new Map<string, bigint>();
    for (const e of entries) {
      const key = e.period;
      grouped.set(key, (grouped.get(key) ?? BigInt(0)) + e.streams);
    }

    const timeSeries = Array.from(grouped.entries())
      .map(([period, streams]) => ({ period, streams: Number(streams) }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { data: timeSeries, period };
  }

  async getTopReleases(tenantId: string, query: { period?: Period; limit?: number }) {
    const { period = '30d', limit = 10 } = query;
    const { from, to } = dateRangeFromPeriod(period as Period);

    const entries = await this.prisma.royaltyEntry.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, releaseUpc: { not: null } },
      select: { releaseUpc: true, streams: true, grossRevenueCents: true },
    });

    const grouped = new Map<string, { streams: bigint; revenue: bigint }>();
    for (const e of entries) {
      const key = e.releaseUpc!;
      const cur = grouped.get(key) ?? { streams: BigInt(0), revenue: BigInt(0) };
      cur.streams += e.streams;
      cur.revenue += e.grossRevenueCents;
      grouped.set(key, cur);
    }

    const sorted = Array.from(grouped.entries())
      .map(([upc, data]) => ({ upc, streams: Number(data.streams), revenueCents: Number(data.revenue) }))
      .sort((a, b) => b.streams - a.streams)
      .slice(0, limit);

    // Enrich with release data
    const upcs = sorted.map((s) => s.upc);
    const releases = await this.prisma.release.findMany({
      where: { upc: { in: upcs }, tenantId },
      select: { upc: true, title: true, artist: { select: { stageName: true } }, coverAsset: { select: { cdnUrl: true } } },
    });

    const releaseMap = new Map(releases.map((r) => [r.upc, r]));

    return {
      data: sorted.map((s) => ({
        ...s,
        title: releaseMap.get(s.upc)?.title ?? null,
        artistName: releaseMap.get(s.upc)?.artist?.stageName ?? null,
        coverUrl: releaseMap.get(s.upc)?.coverAsset?.cdnUrl ?? null,
      })),
      period,
    };
  }

  async getTopTracks(tenantId: string, query: { period?: Period; limit?: number }) {
    const { period = '30d', limit = 10 } = query;
    const { from, to } = dateRangeFromPeriod(period as Period);

    const entries = await this.prisma.royaltyEntry.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, trackIsrc: { not: null } },
      select: { trackIsrc: true, streams: true, grossRevenueCents: true },
    });

    const grouped = new Map<string, { streams: bigint; revenue: bigint }>();
    for (const e of entries) {
      const key = e.trackIsrc!;
      const cur = grouped.get(key) ?? { streams: BigInt(0), revenue: BigInt(0) };
      cur.streams += e.streams;
      cur.revenue += e.grossRevenueCents;
      grouped.set(key, cur);
    }

    const sorted = Array.from(grouped.entries())
      .map(([isrc, data]) => ({ isrc, streams: Number(data.streams), revenueCents: Number(data.revenue) }))
      .sort((a, b) => b.streams - a.streams)
      .slice(0, limit);

    const isrcs = sorted.map((s) => s.isrc);
    const tracks = await this.prisma.track.findMany({
      where: { isrc: { in: isrcs }, tenantId },
      select: { isrc: true, title: true },
    });

    const trackMap = new Map(tracks.map((t) => [t.isrc, t]));

    return {
      data: sorted.map((s) => ({
        ...s,
        title: trackMap.get(s.isrc)?.title ?? null,
      })),
      period,
    };
  }

  async getPlatforms(tenantId: string, query: { period?: Period }) {
    const { period = '30d' } = query;
    const { from, to } = dateRangeFromPeriod(period as Period);

    const entries = await this.prisma.royaltyEntry.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, dspName: { not: null } },
      select: { dspName: true, streams: true, grossRevenueCents: true },
    });

    const grouped = new Map<string, { streams: bigint; revenue: bigint }>();
    for (const e of entries) {
      const key = e.dspName!;
      const cur = grouped.get(key) ?? { streams: BigInt(0), revenue: BigInt(0) };
      cur.streams += e.streams;
      cur.revenue += e.grossRevenueCents;
      grouped.set(key, cur);
    }

    const platforms = Array.from(grouped.entries())
      .map(([platform, data]) => ({ platform, streams: Number(data.streams), revenueCents: Number(data.revenue) }))
      .sort((a, b) => b.streams - a.streams);

    const totalStreams = platforms.reduce((sum, p) => sum + p.streams, 0);

    return {
      data: platforms.map((p) => ({
        ...p,
        percentage: totalStreams > 0 ? Math.round((p.streams / totalStreams) * 10000) / 100 : 0,
      })),
      period,
    };
  }

  async syncManual() {
    return { jobId: 'manual-sync-' + Date.now() };
  }
}
