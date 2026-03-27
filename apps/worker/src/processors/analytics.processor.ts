import type { Job } from 'bullmq';
import type { PrismaClient } from '@vibedistro/database';
import type { DistributionProvider } from '@vibedistro/integrations';

export interface AnalyticsJobData {
  tenantId: string;
  releaseId?: string;
  statementPeriod?: string; // 'YYYY-MM'
  type: 'streams' | 'statement';
}

export async function analyticsProcessor(
  job: Job<AnalyticsJobData>,
  prisma: PrismaClient,
  provider: DistributionProvider,
): Promise<void> {
  const { tenantId, releaseId, statementPeriod, type } = job.data;

  console.log(`[analytics] type=${type} tenant=${tenantId} release=${releaseId ?? 'all'}`);

  if (type === 'streams') {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);

    const mappings = await prisma.externalMapping.findMany({
      where: {
        tenantId,
        entityType: 'release',
        syncStatus: 'SYNCED',
        ...(releaseId ? { releaseId } : {}),
      },
      take: 50,
    });

    if (mappings.length === 0) {
      console.log(`[analytics] No synced mappings found for tenant=${tenantId}`);
      return;
    }

    for (const mapping of mappings) {
      try {
        const analytics = await provider.getAnalytics({
          externalReleaseId: mapping.externalId,
          from: from.toISOString().split('T')[0]!,
          to: now.toISOString().split('T')[0]!,
          granularity: 'day',
        });

        console.log(
          `[analytics] ${analytics.totalStreams} streams for release=${mapping.releaseId ?? mapping.externalId}`,
        );

        await prisma.auditLog.create({
          data: {
            tenantId,
            action: 'analytics.streams_synced',
            resource: 'Release',
            resourceId: mapping.releaseId ?? mapping.externalId,
            after: {
              externalId: mapping.externalId,
              totalStreams: analytics.totalStreams,
              from: from.toISOString().split('T')[0],
              to: now.toISOString().split('T')[0],
            },
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[analytics] Streams fetch failed for mapping=${mapping.id}: ${message}`);
      }
    }
  }

  if (type === 'statement' && statementPeriod) {
    const result = await provider.getStatement({ period: statementPeriod });

    console.log(
      `[analytics] statement period=${statementPeriod} totalRevenueCents=${result.totalRevenueCents}`,
    );

    // Upsert a single RoyaltyStatement for this tenant + period
    const existing = await prisma.royaltyStatement.findFirst({
      where: { tenantId, period: statementPeriod },
    });

    if (existing) {
      await prisma.royaltyStatement.update({
        where: { id: existing.id },
        data: {
          totalRevenueCents: BigInt(result.totalRevenueCents),
          status: 'FINALIZED',
          finalizedAt: new Date(),
        },
      });
    } else {
      await prisma.royaltyStatement.create({
        data: {
          tenantId,
          period: statementPeriod,
          currency: result.currency,
          totalRevenueCents: BigInt(result.totalRevenueCents),
          status: 'FINALIZED',
          finalizedAt: new Date(),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'analytics.statement_synced',
        resource: 'RoyaltyStatement',
        after: {
          period: statementPeriod,
          externalStatementId: result.externalStatementId,
          totalRevenueCents: result.totalRevenueCents,
          entries: result.entries.length,
        },
      },
    });
  }
}
