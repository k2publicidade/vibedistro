export * from './api';

// ============================================================
// ENUMS
// ============================================================

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION'
  | 'INVITED';

export type OnboardingStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

export type TenantStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TRIAL'
  | 'CHURNED'
  | 'SETUP';

export type TenantPlan =
  | 'FREE'
  | 'STARTER'
  | 'PRO'
  | 'ENTERPRISE'
  | 'WHITE_LABEL';

export type ReleaseType =
  | 'SINGLE'
  | 'EP'
  | 'ALBUM'
  | 'COMPILATION'
  | 'MIXTAPE'
  | 'LIVE'
  | 'REMIX'
  | 'SOUNDTRACK';

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

export type TrackStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

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
  | 'CONDUCTOR'
  | 'ORCHESTRA'
  | 'CO_WRITER'
  | 'PUBLISHER'
  | 'SUB_PUBLISHER';

export type RoyaltyStatementStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'AVAILABLE'
  | 'DISPUTED'
  | 'FINAL';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WebhookEventStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'SKIPPED'
  | 'DEAD_LETTERED';

export type SyncStatus =
  | 'PENDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'STALE'
  | 'NOT_APPLICABLE';

export type ProviderEnvironment = 'SANDBOX' | 'STAGING' | 'PRODUCTION';

export type NotificationType =
  | 'RELEASE_STATUS_CHANGED'
  | 'TRACK_STATUS_CHANGED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECISION'
  | 'ROYALTY_STATEMENT_AVAILABLE'
  | 'PAYOUT_STATUS_CHANGED'
  | 'WEBHOOK_FAILED'
  | 'SYNC_FAILED'
  | 'USER_INVITED'
  | 'USER_JOINED'
  | 'TICKET_UPDATED'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

export type AssetType =
  | 'AUDIO'
  | 'COVER_ART'
  | 'ARTIST_PHOTO'
  | 'DOCUMENT'
  | 'VIDEO';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED'
  | 'EXPIRED';

// ============================================================
// DOMAIN MODELS
// ============================================================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  ownerId: string | null;
  maxArtists: number;
  maxReleases: number;
  maxStorageGb: number;
  platformFeePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  tenantId: string;
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
  spotifyId: string | null;
  appleMusicId: string | null;
  youtubeChannelId: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface Contributor {
  id: string;
  trackId: string | null;
  artistId: string | null;
  tenantId: string;
  name: string;
  role: ContributorRole;
  ipiNumber: string | null;
  isni: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DspProfile {
  id: string;
  releaseId: string;
  dspName: string;
  enabled: boolean;
}

export interface CountryRestriction {
  id: string;
  releaseId: string;
  countryCode: string;
  restricted: boolean;
}

export interface ExternalMapping {
  id: string;
  tenantId: string;
  connectionId: string | null;
  entityType: string;
  releaseId: string | null;
  trackId: string | null;
  artistId: string | null;
  statementId: string | null;
  provider: string;
  environment: ProviderEnvironment;
  externalId: string;
  externalReference: string | null;
  externalUrl: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  tenantId: string;
  artistId: string;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  // Included relations (when fetching single release)
  artist?: Artist;
  tracks?: Track[];
  dspProfiles?: DspProfile[];
  restrictions?: CountryRestriction[];
  externalMappings?: ExternalMapping[];
}

export interface Track {
  id: string;
  tenantId: string;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  // Included relations
  contributors?: Contributor[];
}

export interface RoyaltyStatement {
  id: string;
  tenantId: string;
  period: string;
  status: RoyaltyStatementStatus;
  totalRevenueCents: number;
  currency: string;
  processedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Included relations
  entries?: RoyaltyEntry[];
}

export interface RoyaltyEntry {
  id: string;
  statementId: string;
  walletId: string;
  tenantId: string;
  trackIsrc: string | null;
  releaseUpc: string | null;
  dspName: string | null;
  territory: string | null;
  period: string;
  streams: number;
  grossRevenueCents: number;
  netRevenueCents: number;
  platformFeeCents: number;
  currency: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Included relations
  roles?: UserTenantRole[];
}

export interface UserTenantRole {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  isOwner: boolean;
  role?: Role;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tenantId: string | null;
  isSystem: boolean;
}

export interface Invite {
  id: string;
  tenantId: string;
  email: string;
  roleId: string;
  senderId: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
  // Included relations
  actor?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface Ticket {
  id: string;
  tenantId: string;
  createdById: string;
  assignedToId: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolvedAt: string | null;
  closedAt: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Included relations
  messages?: TicketMessage[];
  createdBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  // Included relations
  author?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface IntegrationStatus {
  connected: boolean;
  latency: number | null;
  environment: ProviderEnvironment;
  lastSync: string | null;
  pendingJobs: number;
}

export interface IntegrationHealth {
  status: string;
  latency: number;
}

export interface SyncRecord {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  entitiesProcessed: number;
  errors: number;
}

export interface WebhookEvent {
  id: string;
  tenantId: string | null;
  provider: string;
  environment: ProviderEnvironment;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  attempts: number;
  maxAttempts: number;
  processedAt: string | null;
  failureReason: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface AnalyticsOverview {
  totalStreams: number;
  totalRevenue: number;
  totalArtists: number;
  totalReleases: number;
  deltas: {
    streams: number;
    revenue: number;
    artists: number;
    releases: number;
  };
}

export interface StreamDataPoint {
  date: string;
  streams: number;
}

export interface TopRelease {
  release: Pick<Release, 'id' | 'title' | 'artistId' | 'coverAssetId'> & {
    artist?: Pick<Artist, 'id' | 'stageName'>;
  };
  streams: number;
  delta: number;
}

export interface TopTrack {
  track: Pick<Track, 'id' | 'title' | 'isrc'>;
  streams: number;
  delta: number;
}

export interface PlatformAnalytics {
  platform: string;
  streams: number;
  percentage: number;
}

// ============================================================
// ROYALTY AGGREGATION TYPES
// ============================================================

export interface RoyaltySummary {
  grossRevenue: number;
  netRevenue: number;
  pending: number;
  paid: number;
  deltas: {
    grossRevenue: number;
    netRevenue: number;
  };
}

export interface RoyaltyByArtist {
  artist: Pick<Artist, 'id' | 'stageName' | 'avatarUrl'>;
  gross: number;
  net: number;
  releases: number;
  percentage: number;
}

export interface RoyaltyByPlatform {
  platform: string;
  total: number;
  percentage: number;
}

// ============================================================
// SEARCH TYPES
// ============================================================

export interface GlobalSearchResult {
  artists: Pick<Artist, 'id' | 'stageName' | 'avatarUrl'>[];
  releases: Pick<Release, 'id' | 'title' | 'artistId' | 'coverAssetId'>[];
  tracks: Pick<Track, 'id' | 'title' | 'isrc'>[];
  tickets: Pick<Ticket, 'id' | 'subject' | 'status'>[];
}
