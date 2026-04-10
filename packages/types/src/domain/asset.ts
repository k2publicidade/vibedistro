import type { Timestamps, ID } from '../common';

export type AssetType = 'AUDIO' | 'COVER_ART' | 'ARTIST_PHOTO' | 'DOCUMENT' | 'VIDEO';
export type AssetProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface Asset extends Timestamps {
  id: ID;
  tenantId: ID;
  uploadedById: ID;
  assetType: AssetType;
  processingStatus: AssetProcessingStatus;

  cdnUrl: string | null;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: string; // BigInt serialized as string

  // Audio
  audioFormat: string | null;
  sampleRate: number | null;
  bitDepth: number | null;
  channels: number | null;
  durationMs: number | null;
  loudnessLufs: string | null;

  // Image
  widthPx: number | null;
  heightPx: number | null;
}

export interface UploadUrlRequest {
  filename: string;
  mimeType: string;
  assetType: AssetType;
  fileSizeBytes: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  assetId: string;
  expiresAt: string;
  fields?: Record<string, string>; // for multipart POST
}
