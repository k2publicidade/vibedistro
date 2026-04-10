import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoyaltiesService } from './royalties.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('royalties')
@ApiBearerAuth()
@Controller('royalties')
export class RoyaltiesController {
  constructor(private readonly service: RoyaltiesService) {}

  @Get('summary')
  @RequirePermissions('royalty:read:tenant')
  @ApiOperation({ summary: 'Revenue summary for period' })
  summary(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getSummary(user.tenantId, query);
  }

  @Get('statements')
  @RequirePermissions('royalty:read:tenant')
  @ApiOperation({ summary: 'Paginated royalty statements' })
  statements(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getStatements(user.tenantId, query);
  }

  @Get('statements/:id')
  @RequirePermissions('royalty:read:tenant')
  @ApiOperation({ summary: 'Statement detail with entries' })
  statementDetail(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.service.getStatementDetail(user.tenantId, id);
  }

  @Get('by-artist')
  @RequirePermissions('royalty:read:tenant')
  @ApiOperation({ summary: 'Revenue grouped by artist' })
  byArtist(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getByArtist(user.tenantId, query);
  }

  @Get('by-platform')
  @RequirePermissions('royalty:read:tenant')
  @ApiOperation({ summary: 'Revenue grouped by platform' })
  byPlatform(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.getByPlatform(user.tenantId, query);
  }

  @Post('sync')
  @RequirePermissions('royalty:manage:tenant')
  @ApiOperation({ summary: 'Trigger manual royalty sync' })
  sync() {
    return this.service.syncManual();
  }
}
