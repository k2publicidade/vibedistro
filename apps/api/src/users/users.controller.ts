import { Controller, Get, Post, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('user:read:tenant')
  @ApiOperation({ summary: 'List users in tenant' })
  findAll(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.users.findAll(user.tenantId, query);
  }

  @Get('invites')
  @RequirePermissions('user:read:tenant')
  @ApiOperation({ summary: 'List pending invites' })
  listInvites(@CurrentUser() user: SessionUser) {
    return this.users.listInvites(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('user:read:tenant')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.users.findOne(user.tenantId, id);
  }

  @Post('invite')
  @RequirePermissions('user:create:tenant')
  @ApiOperation({ summary: 'Invite user to tenant' })
  invite(@CurrentUser() user: SessionUser, @Body() dto: any) {
    return this.users.invite(user.tenantId, dto, user.id);
  }

  @Delete('invites/:id')
  @RequirePermissions('user:delete:tenant')
  @ApiOperation({ summary: 'Delete pending invite' })
  deleteInvite(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.users.deleteInvite(user.tenantId, id);
  }

  @Patch(':id/role')
  @RequirePermissions('user:update:tenant')
  @ApiOperation({ summary: 'Update user role in tenant' })
  updateRole(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: any) {
    return this.users.updateUserRole(user.tenantId, id, dto);
  }
}
