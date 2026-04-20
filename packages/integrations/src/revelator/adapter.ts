/**
 * RevelatorAdapter — maps between internal DTOs and the real Revelator API payloads.
 *
 * This is the only file that knows Revelator's wire format.
 * All field names are verified against the swagger spec at https://api.revelator.com/swagger
 */
import type {
  InternalReleaseDTO,
  ExternalStatusDTO,
  AnalyticsQueryDTO,
  AnalyticsResultDTO,
  StatementQueryDTO,
  StatementResultDTO,
  InternalWebhookEventDTO,
} from '../provider.interface';

// releaseTypeId per Revelator /common/lookup/releasetypes
const RELEASE_TYPE_MAP: Record<string, number> = {
  ALBUM: 1,
  SINGLE: 2,
  EP: 4,
  COMPILATION: 6,
};

// Store IDs for our sandbox account (storeIds 507, 508 per /distribution/store/allactives)
// Map common DSP names → Revelator distributorStoreId
const DSP_STORE_MAP: Record<string, number> = {
  spotify: 507,
  apple_music: 508,
  apple: 508,
  itunes: 508,
  // Extend as more stores are enabled for the account
};

export class RevelatorAdapter {
  // ─────────────────────────────────────────────────────────────
  // OUTBOUND: internal → Revelator
  // ─────────────────────────────────────────────────────────────

  /**
   * Build payload for POST /content/release/save
   *
   * Key fields from ReleaseDTO swagger schema:
   *   name, artistId, releaseTypeId, enterpriseId,
   *   upc, releaseDate, primaryMusicStyleId, languageId,
   *   copyrightC, copyrightP, parentalAdvisory,
   *   releaseId (only for updates)
   */
  toRevelatorReleasePayload(
    dto: InternalReleaseDTO,
    enterpriseId: number,
    existingReleaseId?: number,
  ): Record<string, unknown> {
    const releaseTypeId = RELEASE_TYPE_MAP[dto.releaseType.toUpperCase()] ?? 2; // default: Single

    const payload: Record<string, unknown> = {
      name: dto.title,
      version: dto.version,
      enterpriseId,
      releaseTypeId,
      parentalAdvisory: dto.explicit ?? false,
      copyrightC: dto.cLine,
      copyrightP: dto.pLine,
    };

    if (dto.releaseDate) {
      payload['releaseDate'] = new Date(dto.releaseDate).toISOString();
    }
    if (dto.upc) {
      // Revelator stores UPC as numeric
      payload['upc'] = Number(dto.upc);
    }
    if (existingReleaseId) {
      payload['releaseId'] = existingReleaseId;
    }

    // Cover image: coverStorageKey now holds the Revelator fileId (pass-through arch).
    if (dto.coverStorageKey) {
      payload['image'] = { fileId: dto.coverStorageKey };
    }

    return payload;
  }

  /**
   * Convert DSP names from our internal model to Revelator store IDs.
   * Used in POST /distribution/release/addtoqueue body.
   */
  dspNamesToStoreIds(dspNames: string[]): number[] {
    const ids: number[] = [];
    for (const name of dspNames) {
      const id = DSP_STORE_MAP[name.toLowerCase()];
      if (id) ids.push(id);
    }
    return ids.length > 0 ? ids : Object.values(DSP_STORE_MAP);
  }

  /**
   * Analytics query params for /analytics/consumption/byRelease
   * and /analytics/revenue/byRelease
   */
  toRevelatorAnalyticsParams(params: AnalyticsQueryDTO): Record<string, unknown> {
    return {
      'filter.fromDate': params.from,
      'filter.toDate': params.to,
      ...(params.externalReleaseId
        ? { 'filter.releaseIds': [Number(params.externalReleaseId)] }
        : {}),
      ...(params.externalTrackId
        ? { 'filter.trackIds': [Number(params.externalTrackId)] }
        : {}),
      ...(params.territory ? { 'filter.countryIds': [params.territory] } : {}),
      'filter.dateGranularity': params.granularity === 'day' ? 'Day' : 'Month',
      'filter.pageSize': 500,
    };
  }

  /**
   * Revenue statement params for /analytics/revenue/metricsByDate
   * period format: "YYYY-MM" (e.g. "2025-01")
   */
  toRevelatorStatementParams(params: StatementQueryDTO): Record<string, unknown> {
    const [year, month] = params.period.split('-');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const to = `${year}-${month}-${lastDay}`;

    return {
      'filter.fromDate': from,
      'filter.toDate': to,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INBOUND: Revelator → internal
  // ─────────────────────────────────────────────────────────────

  /**
   * Map /distribution/release/all item to ExternalStatusDTO.
   * releaseStatus can be: InProgress, Delivered, Live, TakenDown, Error, etc.
   */
  fromRevelatorDistributionStatus(item: Record<string, unknown> | undefined): ExternalStatusDTO {
    if (!item) {
      return {
        externalId: '',
        status: 'unknown',
        updatedAt: new Date().toISOString(),
      };
    }

    const rawStatus = String(item['releaseStatus'] ?? 'unknown').toLowerCase();

    // Normalize to our internal status vocabulary
    let status = rawStatus;
    if (rawStatus.includes('live')) status = 'live';
    else if (rawStatus.includes('delivered')) status = 'delivered';
    else if (rawStatus.includes('takedown') || rawStatus.includes('taken')) status = 'taken_down';
    else if (rawStatus.includes('error') || rawStatus.includes('reject')) status = 'error';
    else if (rawStatus.includes('progress') || rawStatus.includes('inprogress')) status = 'in_progress';
    else if (rawStatus.includes('inspect')) status = 'under_review';

    return {
      externalId: String(item['releaseId'] ?? ''),
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Map analytics API responses to AnalyticsResultDTO.
   * consumptionData: from /analytics/consumption/byRelease
   * revenueData: from /analytics/revenue/byRelease
   */
  fromRevelatorAnalytics(
    consumptionData: unknown,
    revenueData: unknown,
  ): AnalyticsResultDTO {
    const consumption = consumptionData as {
      items?: Array<Record<string, unknown>>;
      totalItemsCount?: number;
    } | null ?? {};
    const revenue = revenueData as {
      items?: Array<Record<string, unknown>>;
    } | null ?? {};

    const consumptionItems = consumption.items ?? [];
    const revenueItems = revenue.items ?? [];

    const totalStreams = consumptionItems.reduce(
      (sum, item) => sum + Number(item['totalStreams'] ?? item['streams'] ?? 0),
      0,
    );

    const totalRevenueCents = revenueItems.reduce(
      (sum, item) => sum + Math.round(Number(item['net'] ?? item['revenue'] ?? 0) * 100),
      0,
    );

    // Group by distributor/DSP
    const dspMap = new Map<string, { streams: number; revenueCents: number }>();
    for (const item of consumptionItems) {
      const dsp = String(item['distributorName'] ?? item['distributor'] ?? 'unknown');
      const cur = dspMap.get(dsp) ?? { streams: 0, revenueCents: 0 };
      cur.streams += Number(item['totalStreams'] ?? item['streams'] ?? 0);
      dspMap.set(dsp, cur);
    }
    for (const item of revenueItems) {
      const dsp = String(item['distributorName'] ?? item['distributor'] ?? 'unknown');
      const cur = dspMap.get(dsp) ?? { streams: 0, revenueCents: 0 };
      cur.revenueCents += Math.round(Number(item['net'] ?? 0) * 100);
      dspMap.set(dsp, cur);
    }

    return {
      totalStreams,
      totalRevenueCents,
      currency: 'USD',
      byDsp: Array.from(dspMap.entries()).map(([dsp, v]) => ({
        dsp,
        streams: v.streams,
        revenueCents: v.revenueCents,
      })),
      byTerritory: [],
      byDay: [],
    };
  }

  fromRevelatorStatement(period: string, data: unknown): StatementResultDTO {
    const d = data as { items?: Array<Record<string, unknown>> } | null ?? {};
    const items = d.items ?? [];

    const totalRevenueCents = items.reduce(
      (sum, item) => sum + Math.round(Number(item['net'] ?? item['revenue'] ?? 0) * 100),
      0,
    );

    return {
      externalStatementId: `${period}-auto`,
      period,
      totalRevenueCents,
      currency: 'USD',
      entries: items.map((item) => ({
        externalTrackId: item['trackId'] ? String(item['trackId']) : undefined,
        isrc: item['isrc'] as string | undefined,
        upc: item['upc'] ? String(item['upc']) : undefined,
        dsp: String(item['distributorName'] ?? item['distributor'] ?? 'unknown'),
        territory: String(item['country'] ?? item['territory'] ?? 'WORLD'),
        streams: Number(item['streams'] ?? 0),
        revenueCents: Math.round(Number(item['net'] ?? 0) * 100),
      })),
    };
  }

  fromRevelatorWebhookPayload(raw: unknown): InternalWebhookEventDTO {
    const data = raw as Record<string, unknown>;

    // Revelator webhook format (documented format — actual payloads may vary)
    const eventType = String(data['eventType'] ?? data['event_type'] ?? data['type'] ?? 'unknown');
    const entityId = data['releaseId'] ?? data['trackId'] ?? data['artistId'] ?? data['id'];

    return {
      eventType: this.normalizeWebhookEventType(eventType, data),
      entityId: entityId ? String(entityId) : undefined,
      entityType: this.resolveEntityType(data),
      data: data,
      rawPayload: raw,
      receivedAt: new Date().toISOString(),
    };
  }

  private normalizeWebhookEventType(
    rawType: string,
    data: Record<string, unknown>,
  ): string {
    const lower = rawType.toLowerCase();
    if (lower.includes('release') && lower.includes('status')) return 'release.status_changed';
    if (lower.includes('release') && lower.includes('live')) return 'release.status_changed';
    if (lower.includes('takedown')) return 'track.takedown_requested';
    if (lower.includes('statement') || lower.includes('royalt')) return 'royalty.statement_available';

    // Infer from data shape
    if (data['releaseId'] && data['releaseStatus']) return 'release.status_changed';

    return rawType;
  }

  private resolveEntityType(
    data: Record<string, unknown>,
  ): 'release' | 'track' | 'artist' | 'statement' {
    if (data['releaseId']) return 'release';
    if (data['trackId']) return 'track';
    if (data['artistId']) return 'artist';

    const type = String(data['entity_type'] ?? data['resource'] ?? '').toLowerCase();
    if (type.includes('track')) return 'track';
    if (type.includes('artist')) return 'artist';
    if (type.includes('statement') || type.includes('royalt')) return 'statement';

    return 'release';
  }
}
