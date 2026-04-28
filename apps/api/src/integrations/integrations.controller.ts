import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';
import { RevelatorAuthorizeUrlDto } from '../onboarding/dto/revelator-authorize-url.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('health')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'Provider health check' })
  health(@CurrentUser() user: SessionUser) {
    return this.integrations.getHealth(user.tenantId);
  }

  @Get('status')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'Integration connection status' })
  status(@CurrentUser() user: SessionUser) {
    return this.integrations.getStatus(user.tenantId);
  }

  @Get('sync-history')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'Sync job execution history' })
  syncHistory(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.integrations.getSyncHistory(user.tenantId, query);
  }

  @Get('webhooks/failed')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'List failed webhook events' })
  failedWebhooks(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.integrations.listFailedWebhooks(user.tenantId, query);
  }

  @Post('webhooks/:id/retry')
  @RequirePermissions('integration:manage:global')
  @ApiOperation({ summary: 'Manually retry a failed webhook' })
  retryWebhook(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.integrations.retryWebhook(user.tenantId, id);
  }

  @Get('mappings')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'List external ID mappings' })
  mappings(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.integrations.listExternalMappings(user.tenantId, query);
  }

  @Post('revelator/authorize-url')
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'Create Revelator white-label authorize URL' })
  createRevelatorAuthorizeUrl(
    @CurrentUser() user: SessionUser,
    @Body() dto: RevelatorAuthorizeUrlDto,
  ) {
    return this.integrations.createRevelatorAuthorizeUrl(user.tenantId, dto.redirectUrl);
  }
}
