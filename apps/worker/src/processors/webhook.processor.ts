import type { Job } from 'bullmq';
import type { PrismaClient } from '@vibedistro/database';
import type { DistributionProvider } from '@vibedistro/integrations';

export interface WebhookJobData {
  webhookEventId: string;
  tenantId: string;
}

export async function webhookProcessor(
  job: Job<WebhookJobData>,
  prisma: PrismaClient,
  provider: DistributionProvider,
): Promise<void> {
  const { webhookEventId, tenantId } = job.data;

  const event = await prisma.webhookEvent.findFirst({
    where: { id: webhookEventId, tenantId },
  });

  if (!event) {
    console.warn(`[webhook] Event ${webhookEventId} not found, skipping`);
    return;
  }

  if (event.status === 'PROCESSED') {
    console.log(`[webhook] Event ${webhookEventId} already processed, skipping`);
    return;
  }

  console.log(`[webhook] Processing event=${webhookEventId} type=${event.eventType}`);

  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { status: 'PROCESSING', processedAt: new Date() },
  });

  try {
    const payload = event.payload as Record<string, unknown>;
    const dto = provider.parseWebhookEvent(payload);

    switch (dto.eventType) {
      case 'release.status_changed': {
        const externalId = dto.entityId;
        const newStatus = dto.data['status'] as string | undefined;

        if (!externalId || !newStatus) break;

        const mapping = await prisma.externalMapping.findFirst({
          where: {
            externalId,
            provider: provider.providerName,
            entityType: 'release',
            tenantId,
          },
        });

        if (!mapping?.releaseId) {
          console.warn(`[webhook] No mapping found for externalId=${externalId}`);
          break;
        }

        const isSynced = newStatus === 'live' || newStatus === 'delivered';
        await prisma.externalMapping.update({
          where: { id: mapping.id },
          data: {
            syncStatus: isSynced ? 'SYNCED' : 'SYNCING',
            lastSyncedAt: new Date(),
          },
        });

        if (isSynced) {
          await prisma.release.update({
            where: { id: mapping.releaseId },
            data: { status: 'LIVE' },
          });
          console.log(`[webhook] Release ${mapping.releaseId} marked LIVE`);
        }
        break;
      }

      case 'royalty.statement_available': {
        console.log(`[webhook] Royalty statement available for tenant=${tenantId}:`, dto.data);
        // Future: enqueue analytics-ingest job for this statement
        break;
      }

      case 'track.takedown_requested': {
        const externalId = dto.entityId;
        if (!externalId) break;

        const mapping = await prisma.externalMapping.findFirst({
          where: { externalId, provider: provider.providerName, entityType: 'track', tenantId },
        });

        if (mapping?.releaseId) {
          await prisma.release.update({
            where: { id: mapping.releaseId },
            data: { status: 'TAKEDOWN' },
          });
          console.log(`[webhook] Takedown applied to release ${mapping.releaseId}`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${dto.eventType}`);
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[webhook] Failed to process event ${webhookEventId}:`, message);

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: 'FAILED',
        errorMessage: message,
        retryCount: { increment: 1 },
      },
    });

    throw err;
  }
}
