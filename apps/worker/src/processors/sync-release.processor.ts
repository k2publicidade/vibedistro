import type { Job } from 'bullmq';
import type { PrismaClient } from '@vibedistro/database';
import type { DistributionProvider, InternalReleaseDTO } from '@vibedistro/integrations';

export interface SyncReleaseJobData {
  releaseId: string;
  tenantId: string;
  action: 'submit' | 'update' | 'status_check';
}

export async function syncReleaseProcessor(
  job: Job<SyncReleaseJobData>,
  prisma: PrismaClient,
  provider: DistributionProvider,
): Promise<void> {
  const { releaseId, tenantId, action } = job.data;

  console.log(`[sync-release] ${action} release=${releaseId} tenant=${tenantId}`);

  const release = await prisma.release.findFirst({
    where: { id: releaseId, tenantId },
    include: {
      artist: true,
      releaseTracks: {
        include: { track: { include: { contributors: true, audioAsset: true } } },
        orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
      },
      coverAsset: true,
      dspProfiles: true,
      countryRestrictions: true,
    },
  });

  if (!release) throw new Error(`Release ${releaseId} not found`);

  if (action === 'status_check') {
    const mapping = await prisma.externalMapping.findFirst({
      where: { releaseId, provider: provider.providerName, syncStatus: 'SYNCED' },
    });

    if (!mapping) {
      console.warn(`No external mapping for release ${releaseId}, skipping status check`);
      return;
    }

    const status = await provider.getReleaseStatus(mapping.externalId);
    await prisma.externalMapping.update({
      where: { id: mapping.id },
      data: {
        syncStatus: status.status === 'live' ? 'SYNCED' : 'SYNCING',
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  // Build InternalReleaseDTO
  const dto: InternalReleaseDTO = {
    internalId: release.id,
    title: release.title,
    version: release.version ?? undefined,
    releaseType: release.releaseType,
    upc: release.upc ?? undefined,
    releaseDate: release.releaseDate?.toISOString().split('T')[0],
    genre: release.genre ?? undefined,
    subgenre: release.subgenre ?? undefined,
    language: release.language ?? undefined,
    explicit: release.explicit,
    cLine: release.cLine ?? undefined,
    pLine: release.pLine ?? undefined,
    copyrightYear: release.copyrightYear ?? undefined,
    artist: {
      internalId: release.artist.id,
      stageName: release.artist.stageName,
      legalName: release.artist.legalName,
      country: release.artist.country ?? undefined,
      isni: release.artist.isni ?? undefined,
      ipiNumber: release.artist.ipiNumber ?? undefined,
    },
    coverStorageKey: release.coverAsset?.storageKey ?? '',
    tracks: release.releaseTracks.map((rt) => ({
      internalId: rt.track.id,
      title: rt.track.title,
      version: rt.track.version ?? undefined,
      isrc: rt.track.isrc ?? undefined,
      explicit: rt.track.explicit,
      language: rt.track.language ?? undefined,
      durationMs: rt.track.durationMs ?? undefined,
      bpm: rt.track.bpm ?? undefined,
      cLine: rt.track.cLine ?? undefined,
      pLine: rt.track.pLine ?? undefined,
      copyrightYear: rt.track.copyrightYear ?? undefined,
      audioStorageKey: rt.track.audioAsset?.storageKey ?? '',
      contributors: rt.track.contributors.map((c) => ({
        name: c.name,
        role: c.role,
        ipiNumber: c.ipiNumber ?? undefined,
      })),
    })),
    targetDsps: release.dspProfiles.filter((d) => d.enabled).map((d) => d.dspName),
    countryRestrictions: release.countryRestrictions.map((cr) => ({
      country: cr.countryCode,
      restricted: cr.restricted,
    })),
  };

  // Idempotency key
  const idempotencyKey = `revelator:${provider.environment}:release:${releaseId}:${action}`;

  try {
    if (action === 'submit') {
      const ref = await provider.submitRelease(dto);

      await prisma.externalMapping.upsert({
        where: { provider_environment_entityType_externalId: {
          provider: provider.providerName,
          environment: provider.environment as any,
          entityType: 'release',
          externalId: ref.externalId,
        }},
        create: {
          tenantId,
          releaseId,
          provider: provider.providerName,
          environment: provider.environment as any,
          entityType: 'release',
          externalId: ref.externalId,
          externalReference: ref.externalReference,
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
          idempotencyKey,
        },
        update: { syncStatus: 'SYNCED', lastSyncedAt: new Date() },
      });

      await prisma.release.update({
        where: { id: releaseId },
        data: { status: 'SUBMITTED', distributionDeliveredAt: new Date() },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await prisma.externalMapping.updateMany({
      where: { releaseId, provider: provider.providerName },
      data: { syncStatus: 'FAILED', lastErrorMessage: message, lastSyncedAt: new Date() },
    });
    throw err;
  }
}
