import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  @RequirePermissions('ticket:read:tenant')
  @ApiOperation({ summary: 'List tickets' })
  findAll(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('ticket:read:tenant')
  @ApiOperation({ summary: 'Get ticket with messages' })
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('ticket:create:tenant')
  @ApiOperation({ summary: 'Create ticket' })
  create(@CurrentUser() user: SessionUser, @Body() dto: any) {
    return this.service.create(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('ticket:update:tenant')
  @ApiOperation({ summary: 'Update ticket status/priority' })
  update(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Post(':id/messages')
  @RequirePermissions('ticket:create:tenant')
  @ApiOperation({ summary: 'Add message to ticket' })
  addMessage(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: any) {
    return this.service.addMessage(user.tenantId, id, dto, user.id);
  }
}
