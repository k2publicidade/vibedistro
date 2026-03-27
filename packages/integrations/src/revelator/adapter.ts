/**
 * RevelatorAdapter — maps between internal DTOs and raw Revelator API payloads.
 *
 * IMPORTANT: This is the only file that should know about Revelator's wire format.
 * Assumptions about the actual API shape are marked with TODO comments.
 * Replace with real field names once the Revelator sandbox docs are reviewed.
 */
import type {
  InternalReleaseDTO,
  ExternalReleaseRef,
  ExternalStatusDTO,
  AnalyticsQueryDTO,
  AnalyticsResultDTO,
  StatementQueryDTO,
  StatementResultDTO,
  InternalWebhookEventDTO,
} from '../provider.interface.js';

export class RevelatorAdapter {
  // ---- Outbound (internal → Revelator) ----

  toRevelatorReleasePayload(dto: InternalReleaseDTO): Record<string, unknown> {
    // TODO: Replace field names with actual Revelator API spec once confirmed
    return {
      title: dto.title,
      version: dto.version,
      release_type: dto.releaseType.toLowerCase(),
      upc: dto.upc,
      release_date: dto.releaseDate,
      genre: dto.genre,
      subgenre: dto.subgenre,
      language: dto.language,
      explicit: dto.explicit,
      c_line: dto.cLine,
      p_line: dto.pLine,
      copyright_year: dto.copyrightYear,
      artist: {
        name: dto.artist.stageName,
        legal_name: dto.artist.legalName,
        country: dto.artist.country,
        isni: dto.artist.isni,
        ipi: dto.artist.ipiNumber,
      },
      cover_file_key: dto.coverStorageKey,
      tracks: dto.tracks.map((t) => ({
        title: t.title,
        version: t.version,
        isrc: t.isrc,
        explicit: t.explicit,
        language: t.language,
        duration_ms: t.durationMs,
        bpm: t.bpm,
        c_line: t.cLine,
        p_line: t.pLine,
        audio_file_key: t.audioStorageKey,
        contributors: t.contributors.map((c) => ({
          name: c.name,
          role: c.role.toLowerCase(),
          ipi: c.ipiNumber,
          split_percentage: c.splitPercentage,
        })),
      })),
      dsps: dto.targetDsps,
      country_restrictions: dto.countryRestrictions ?? [],
    };
  }

  toRevelatorAnalyticsParams(params: AnalyticsQueryDTO): Record<string, unknown> {
    return {
      from: params.from,
      to: params.to,
      release_id: params.externalReleaseId,
      track_id: params.externalTrackId,
      dsp: params.dsp,
      territory: params.territory,
    };
  }

  toRevelatorStatementParams(params: StatementQueryDTO): Record<string, unknown> {
    return {
      period: params.period,
      artist_id: params.externalArtistId,
    };
  }

  // ---- Inbound (Revelator → internal) ----

  fromRevelatorReleaseRef(data: Record<string, unknown>): ExternalReleaseRef {
    return {
      externalId: String(data['id'] ?? data['release_id']),
      externalReference: data['reference'] as string | undefined,
      status: String(data['status'] ?? 'submitted'),
      submittedAt: String(data['submitted_at'] ?? data['created_at'] ?? new Date().toISOString()),
    };
  }

  fromRevelatorStatus(data: Record<string, unknown>): ExternalStatusDTO {
    return {
      externalId: String(data['id']),
      status: String(data['status']),
      message: data['message'] as string | undefined,
      liveUrls: data['live_urls'] as Record<string, string> | undefined,
      updatedAt: String(data['updated_at'] ?? new Date().toISOString()),
    };
  }

  fromRevelatorAnalytics(data: Record<string, unknown>): AnalyticsResultDTO {
    const byDsp = (data['by_dsp'] as Array<Record<string, unknown>> | undefined) ?? [];
    const byTerritory = (data['by_territory'] as Array<Record<string, unknown>> | undefined) ?? [];
    const byDay = (data['by_day'] as Array<Record<string, unknown>> | undefined) ?? [];

    return {
      totalStreams: Number(data['total_streams'] ?? 0),
      totalRevenueCents: Number(data['total_revenue_cents'] ?? 0),
      currency: String(data['currency'] ?? 'USD'),
      byDsp: byDsp.map((d) => ({
        dsp: String(d['dsp']),
        streams: Number(d['streams']),
        revenueCents: Number(d['revenue_cents'] ?? 0),
      })),
      byTerritory: byTerritory.map((t) => ({
        territory: String(t['territory']),
        streams: Number(t['streams']),
      })),
      byDay: byDay.map((d) => ({
        date: String(d['date']),
        streams: Number(d['streams']),
        revenueCents: Number(d['revenue_cents'] ?? 0),
      })),
    };
  }

  fromRevelatorStatement(data: Record<string, unknown>): StatementResultDTO {
    const entries = (data['entries'] as Array<Record<string, unknown>> | undefined) ?? [];

    return {
      externalStatementId: String(data['id']),
      period: String(data['period']),
      totalRevenueCents: Number(data['total_revenue_cents'] ?? 0),
      currency: String(data['currency'] ?? 'USD'),
      entries: entries.map((e) => ({
        externalTrackId: e['track_id'] as string | undefined,
        isrc: e['isrc'] as string | undefined,
        upc: e['upc'] as string | undefined,
        dsp: String(e['dsp']),
        territory: String(e['territory']),
        streams: Number(e['streams']),
        revenueCents: Number(e['revenue_cents'] ?? 0),
      })),
    };
  }

  fromRevelatorWebhookPayload(raw: unknown): InternalWebhookEventDTO {
    const data = raw as Record<string, unknown>;

    return {
      eventType: String(data['event_type'] ?? data['type']),
      externalId: String(data['id'] ?? data['release_id'] ?? data['track_id']),
      entityType: this.resolveEntityType(data),
      externalReference: data['reference'] as string | undefined,
      status: data['status'] as string | undefined,
      rawPayload: raw,
      receivedAt: new Date().toISOString(),
    };
  }

  private resolveEntityType(
    data: Record<string, unknown>,
  ): 'release' | 'track' | 'artist' | 'statement' {
    const type = String(data['entity_type'] ?? data['resource'] ?? '');
    if (type.includes('release')) return 'release';
    if (type.includes('track')) return 'track';
    if (type.includes('artist')) return 'artist';
    if (type.includes('statement') || type.includes('royalt')) return 'statement';
    return 'release'; // fallback
  }
}
