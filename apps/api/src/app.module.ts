import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { UsersModule } from './users/users.module.js';
import { ArtistsModule } from './artists/artists.module.js';
import { ReleasesModule } from './releases/releases.module.js';
import { TracksModule } from './tracks/tracks.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { RoyaltiesModule } from './royalties/royalties.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuditModule } from './audit/audit.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { HealthModule } from './health/health.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RbacGuard } from './auth/guards/rbac.guard.js';
import { TenantGuard } from './auth/guards/tenant.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TerminusModule,
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ArtistsModule,
    ReleasesModule,
    TracksModule,
    AssetsModule,
    RoyaltiesModule,
    AnalyticsModule,
    TicketsModule,
    NotificationsModule,
    AuditModule,
    IntegrationsModule,
    WebhooksModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
})
export class AppModule {}
