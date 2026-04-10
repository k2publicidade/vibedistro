import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  @RequirePermissions('analytics:read:tenant')
  @ApiOperation({ summary: 'Aggregate KPIs overview' })
  overview(@CurrentUser() user: SessionUser, @Query('period') period?: string) {
    return this.service.getOverview(user.tenantId, (period as any) ?? '30d');
  }

  @Get('streams')
  @RequirePermissions('analytics:read:tenant')
  @ApiOperation({ summary: 'Stream time series' })
  streams(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getStreams(user.tenantId, query);
  }

  @Get('top-releases')
  @RequirePermissions('analytics:read:tenant')
  @ApiOperation({ summary: 'Top releases by streams' })
  topReleases(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getTopReleases(user.tenantId, query);
  }

  @Get('top-tracks')
  @RequirePermissions('analytics:read:tenant')
  @ApiOperation({ summary: 'Top tracks by streams' })
  topTracks(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getTopTracks(user.tenantId, query);
  }

  @Get('platforms')
  @RequirePermissions('analytics:read:tenant')
  @ApiOperation({ summary: 'Streams grouped by platform' })
  platforms(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getPlatforms(user.tenantId, query);
  }

  @Post('sync')
  @RequirePermissions('analytics:manage:tenant')
  @ApiOperation({ summary: 'Trigger manual analytics sync' })
  sync() {
    return this.service.syncManual();
  }
}
