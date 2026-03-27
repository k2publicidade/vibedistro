import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('user:read:tenant')
  findAll(@CurrentUser() user: SessionUser, @Query() query: any) { return this.users.findAll(user.tenantId, query); }

  @Get(':id')
  @RequirePermissions('user:read:tenant')
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) { return this.users.findOne(user.tenantId, id); }

  @Post('invite')
  @RequirePermissions('user:create:tenant')
  invite(@CurrentUser() user: SessionUser, @Body() dto: any) { return this.users.invite(user.tenantId, dto, user.id); }
}
