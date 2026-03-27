import type { AuditFields, ID } from '../common.js';

export type TrackStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type ContributorRole =
  | 'MAIN_ARTIST'
  | 'FEATURING_ARTIST'
  | 'PRODUCER'
  | 'COMPOSER'
  | 'LYRICIST'
  | 'ARRANGER'
  | 'MIXER'
  | 'MASTERING_ENGINEER'
  | 'RECORDING_ENGINEER'
  | 'REMIXER'
  | 'PERFORMER'
  | 'CO_WRITER'
  | 'PUBLISHER';

export interface Contributor {
  id: ID;
  name: string;
  role: ContributorRole;
  ipiNumber: string | null;
  isni: string | null;
  isPrimary: boolean;
  splitPercentage?: string; // from SplitLine
}

export interface Track extends AuditFields {
  id: ID;
  tenantId: ID;
  title: string;
  version: string | null;
  status: TrackStatus;
  isrc: string | null;
  explicit: boolean;
  language: string | null;
  durationMs: number | null;
  bpm: number | null;
  keySignature: string | null;
  cLine: string | null;
  pLine: string | null;
  copyrightYear: number | null;
  publisherName: string | null;
  publishingIpi: string | null;
  audioAssetId: string | null;
}

export interface CreateTrackDto {
  title: string;
  version?: string;
  isrc?: string;
  explicit?: boolean;
  language?: string;
  durationMs?: number;
  bpm?: number;
  keySignature?: string;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  publisherName?: string;
  publishingIpi?: string;
  contributors?: Array<{
    name: string;
    role: ContributorRole;
    ipiNumber?: string;
    isni?: string;
    isPrimary?: boolean;
  }>;
}

export type UpdateTrackDto = Partial<CreateTrackDto>;
