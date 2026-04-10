import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReleasesService } from './releases.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser, ReleaseStatus } from '@vibedistro/types';

@ApiTags('releases')
@ApiBearerAuth()
@Controller('releases')
export class ReleasesController {
  constructor(private readonly releases: ReleasesService) {}

  @Get()
  @RequirePermissions('release:read:tenant')
  findAll(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.releases.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('release:read:tenant')
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.releases.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('release:create:tenant')
  create(@CurrentUser() user: SessionUser, @Body() dto: any) {
    return this.releases.create(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('release:update:tenant')
  update(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: any) {
    return this.releases.update(user.tenantId, id, dto, user.id);
  }

  @Post(':id/status')
  @RequirePermissions('release:update:tenant')
  @ApiOperation({ summary: 'Transition release workflow status' })
  transitionStatus(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body('status') status: ReleaseStatus,
  ) {
    return this.releases.transitionStatus(user.tenantId, id, status, user.id);
  }

  @Post(':id/submit')
  @RequirePermissions('release:submit:tenant')
  @ApiOperation({ summary: 'Submit approved release for distribution' })
  submit(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.releases.transitionStatus(user.tenantId, id, 'SUBMITTED', user.id);
  }

  @Delete(':id')
  @RequirePermissions('release:delete:tenant')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.releases.remove(user.tenantId, id, user.id);
  }
}
