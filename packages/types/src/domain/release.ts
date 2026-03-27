import type { AuditFields, ID } from '../common.js';

export type ReleaseType = 'SINGLE' | 'EP' | 'ALBUM' | 'COMPILATION' | 'MIXTAPE' | 'LIVE' | 'REMIX' | 'SOUNDTRACK';

export type ReleaseStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'SUBMITTED'
  | 'DELIVERED'
  | 'LIVE'
  | 'TAKEDOWN_REQUESTED'
  | 'TAKEN_DOWN'
  | 'REJECTED'
  | 'ARCHIVED';

export interface Release extends AuditFields {
  id: ID;
  tenantId: ID;
  artistId: ID;
  title: string;
  version: string | null;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  upc: string | null;
  catalogNumber: string | null;
  releaseDate: string | null;
  originalReleaseDate: string | null;
  genre: string | null;
  subgenre: string | null;
  language: string | null;
  explicit: boolean;
  cLine: string | null;
  pLine: string | null;
  copyrightYear: number | null;
  distributionScheduledAt: string | null;
  distributionDeliveredAt: string | null;
  liveSince: string | null;
  coverAssetId: string | null;
}

export interface CreateReleaseDto {
  artistId: string;
  title: string;
  releaseType: ReleaseType;
  version?: string;
  upc?: string;
  catalogNumber?: string;
  releaseDate?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  explicit?: boolean;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  distributionScheduledAt?: string;
}

export type UpdateReleaseDto = Partial<CreateReleaseDto>;

export interface ReleaseWithTracks extends Release {
  tracks: Array<{
    trackId: string;
    trackNumber: number;
    discNumber: number;
    title: string;
    isrc: string | null;
    durationMs: number | null;
  }>;
}
