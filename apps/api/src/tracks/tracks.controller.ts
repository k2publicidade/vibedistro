import { Controller,Get,Post,Patch,Param,Body,Query } from '@nestjs/common';
import { ApiTags,ApiBearerAuth } from '@nestjs/swagger';
import { TracksService } from './tracks.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { SessionUser } from '@vibedistro/types';
@ApiTags('tracks') @ApiBearerAuth() @Controller('tracks')
export class TracksController {
  constructor(private readonly s: TracksService) {}
  @Get() @RequirePermissions('release:read:tenant') findAll(@CurrentUser() u: SessionUser, @Query() q: any) { return this.s.findAll(u.tenantId,q); }
  @Get(':id') @RequirePermissions('release:read:tenant') findOne(@CurrentUser() u: SessionUser, @Param('id') id: string) { return this.s.findOne(u.tenantId,id); }
  @Post() @RequirePermissions('release:create:tenant') create(@CurrentUser() u: SessionUser, @Body() dto: any) { return this.s.create(u.tenantId,dto,u.id); }
  @Patch(':id') @RequirePermissions('release:update:tenant') update(@CurrentUser() u: SessionUser, @Param('id') id: string, @Body() dto: any) { return this.s.update(u.tenantId,id,dto,u.id); }
}
