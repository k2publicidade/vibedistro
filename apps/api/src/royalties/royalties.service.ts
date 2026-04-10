import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoyaltiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, query: { period?: string }) {
    const { period } = query;

    const where = {
      tenantId,
      ...(period && { period }),
    };

    const [totals, pendingStatements, finalStatements] = await Promise.all([
      this.prisma.royaltyEntry.aggregate({
        where,
        _sum: { grossRevenueCents: true, netRevenueCents: true },
      }),
      this.prisma.royaltyStatement.findMany({
        where: { tenantId, ...(period && { period }), status: { not: 'FINAL' } },
        select: { totalRevenueCents: true },
      }),
      this.prisma.royaltyStatement.findMany({
        where: { tenantId, ...(period && { period }), status: 'FINAL' },
        select: { totalRevenueCents: true },
      }),
    ]);

    const pendingCents = pendingStatements.reduce((sum, s) => sum + Number(s.totalRevenueCents), 0);
    const paidCents = finalStatements.reduce((sum, s) => sum + Number(s.totalRevenueCents), 0);

    return {
      grossRevenueCents: Number(totals._sum.grossRevenueCents ?? 0),
      netRevenueCents: Number(totals._sum.netRevenueCents ?? 0),
      pendingCents,
      paidCents,
      period: period ?? 'all',
    };
  }

  async getStatements(tenantId: string, query: { page?: number; perPage?: number; period?: string; artistId?: string; status?: string }) {
    const { period, status } = query;
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ...(period && { period }),
      ...(status && { status: status as any }),
    };

    const [data, total] = await Promise.all([
      this.prisma.royaltyStatement.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' as const },
        include: { _count: { select: { entries: true } } },
      }),
      this.prisma.royaltyStatement.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        period: s.period,
        status: s.status,
        totalRevenueCents: Number(s.totalRevenueCents),
        currency: s.currency,
        entriesCount: s._count.entries,
        processedAt: s.processedAt,
        finalizedAt: s.finalizedAt,
        createdAt: s.createdAt,
      })),
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getStatementDetail(tenantId: string, id: string) {
    const statement = await this.prisma.royaltyStatement.findFirst({
      where: { id, tenantId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' as const },
          take: 500,
        },
      },
    });
    if (!statement) throw new NotFoundException('Statement not found');

    // Enrich entries with track/release data
    const isrcs = statement.entries.map((e) => e.trackIsrc).filter(Boolean) as string[];
    const upcs = statement.entries.map((e) => e.releaseUpc).filter(Boolean) as string[];

    const [tracks, releases] = await Promise.all([
      isrcs.length > 0
        ? this.prisma.track.findMany({
            where: { isrc: { in: isrcs } },
            select: { isrc: true, title: true },
          })
        : [],
      upcs.length > 0
        ? this.prisma.release.findMany({
            where: { upc: { in: upcs } },
            select: { upc: true, title: true, artist: { select: { stageName: true } } },
          })
        : [],
    ]);

    const trackMap = new Map(tracks.map((t): [string | null, string] => [t.isrc, t.title]));
    const releaseMap = new Map(releases.map((r): [string | null, { title: string; artist: string }] => [r.upc, { title: r.title, artist: (r.artist as any)?.stageName ?? '' }]));

    return {
      id: statement.id,
      period: statement.period,
      status: statement.status,
      totalRevenueCents: Number(statement.totalRevenueCents),
      currency: statement.currency,
      processedAt: statement.processedAt,
      finalizedAt: statement.finalizedAt,
      entries: statement.entries.map((e) => ({
        id: e.id,
        trackIsrc: e.trackIsrc,
        trackTitle: e.trackIsrc ? trackMap.get(e.trackIsrc) ?? null : null,
        releaseUpc: e.releaseUpc,
        releaseTitle: e.releaseUpc ? releaseMap.get(e.releaseUpc)?.title ?? null : null,
        artistName: e.releaseUpc ? releaseMap.get(e.releaseUpc)?.artist ?? null : null,
        dspName: e.dspName,
        territory: e.territory,
        period: e.period,
        streams: Number(e.streams),
        grossRevenueCents: Number(e.grossRevenueCents),
        netRevenueCents: Number(e.netRevenueCents),
        platformFeeCents: Number(e.platformFeeCents),
      })),
    };
  }

  async getByArtist(tenantId: string, query: { period?: string }) {
    const { period } = query;

    const entries = await this.prisma.royaltyEntry.findMany({
      where: { tenantId, ...(period && { period }), trackIsrc: { not: null } },
      select: { trackIsrc: true, grossRevenueCents: true, netRevenueCents: true, streams: true },
    });

    // Map ISRC -> Track -> ReleaseTrack -> Release -> Artist
    const isrcs = [...new Set(entries.map((e) => e.trackIsrc).filter(Boolean))] as string[];

    if (isrcs.length === 0) return { data: [] };

    const tracks = await this.prisma.track.findMany({
      where: { isrc: { in: isrcs }, tenantId },
      select: {
        isrc: true,
        releaseTracks: {
          select: { release: { select: { artistId: true, artist: { select: { id: true, stageName: true } } } } },
          take: 1,
        },
      },
    });

    const isrcToArtist = new Map<string, { id: string; stageName: string }>();
    for (const t of tracks) {
      if (t.isrc && t.releaseTracks[0]) {
        isrcToArtist.set(t.isrc, t.releaseTracks[0].release.artist);
      }
    }

    const grouped = new Map<string, { stageName: string; streams: bigint; grossCents: bigint; netCents: bigint }>();
    for (const e of entries) {
      const artist = isrcToArtist.get(e.trackIsrc!);
      if (!artist) continue;
      const cur = grouped.get(artist.id) ?? { stageName: artist.stageName, streams: BigInt(0), grossCents: BigInt(0), netCents: BigInt(0) };
      cur.streams += e.streams;
      cur.grossCents += e.grossRevenueCents;
      cur.netCents += e.netRevenueCents;
      grouped.set(artist.id, cur);
    }

    const data = Array.from(grouped.entries())
      .map(([artistId, d]) => ({
        artistId,
        stageName: d.stageName,
        streams: Number(d.streams),
        grossRevenueCents: Number(d.grossCents),
        netRevenueCents: Number(d.netCents),
      }))
      .sort((a, b) => b.grossRevenueCents - a.grossRevenueCents);

    return { data };
  }

  async getByPlatform(tenantId: string, query: { period?: string }) {
    const { period } = query;

    const entries = await this.prisma.royaltyEntry.findMany({
      where: { tenantId, ...(period && { period }), dspName: { not: null } },
      select: { dspName: true, grossRevenueCents: true, netRevenueCents: true, streams: true },
    });

    const grouped = new Map<string, { streams: bigint; grossCents: bigint; netCents: bigint }>();
    for (const e of entries) {
      const key = e.dspName!;
      const cur = grouped.get(key) ?? { streams: BigInt(0), grossCents: BigInt(0), netCents: BigInt(0) };
      cur.streams += e.streams;
      cur.grossCents += e.grossRevenueCents;
      cur.netCents += e.netRevenueCents;
      grouped.set(key, cur);
    }

    const data = Array.from(grouped.entries())
      .map(([platform, d]) => ({
        platform,
        streams: Number(d.streams),
        grossRevenueCents: Number(d.grossCents),
        netRevenueCents: Number(d.netCents),
      }))
      .sort((a, b) => b.grossRevenueCents - a.grossRevenueCents);

    return { data };
  }

  async syncManual() {
    return { jobId: 'manual-sync-' + Date.now() };
  }
}
