import type { AuditFields, ID } from '../common';

export interface Artist extends AuditFields {
  id: ID;
  tenantId: ID;
  legalName: string;
  stageName: string;
  bio: string | null;
  country: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isni: string | null;
  ipiNumber: string | null;
  proAffiliation: string | null;

  // Social
  spotifyId: string | null;
  appleMusicId: string | null;
  youtubeChannelId: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;

  onboardingStatus: string;
}

export interface CreateArtistDto {
  legalName: string;
  stageName: string;
  bio?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  isni?: string;
  ipiNumber?: string;
  proAffiliation?: string;
  spotifyId?: string;
  appleMusicId?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  websiteUrl?: string;
}

export type UpdateArtistDto = Partial<CreateArtistDto>;
