export interface AnalyticsOverview {
  totalStreams: number;
  totalRevenueCents: number;
  currency: string;
  topTracks: Array<{ trackId: string; title: string; streams: number }>;
  topDsps: Array<{ dspName: string; streams: number; revenueCents: number }>;
  topTerritories: Array<{ territory: string; streams: number }>;
  streamsByDay: Array<{ date: string; streams: number }>;
}

export interface AnalyticsQueryParams {
  from: string; // ISO date
  to: string;
  artistId?: string;
  releaseId?: string;
  dsp?: string;
  territory?: string;
}
