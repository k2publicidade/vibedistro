import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { ArtistsModule } from './artists/artists.module';
import { ReleasesModule } from './releases/releases.module';
import { TracksModule } from './tracks/tracks.module';
import { AssetsModule } from './assets/assets.module';
import { RoyaltiesModule } from './royalties/royalties.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { SearchModule } from './search/search.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RbacGuard } from './auth/guards/rbac.guard';
import { TenantGuard } from './auth/guards/tenant.guard';

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
    SearchModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
})
export class AppModule {}
