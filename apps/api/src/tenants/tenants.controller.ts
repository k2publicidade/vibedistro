import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant from JWT' })
  current(@CurrentUser() user: SessionUser) {
    return this.tenants.findCurrent(user.tenantId);
  }

  @Get()
  @RequirePermissions('tenant:read:global')
  @ApiOperation({ summary: 'List all tenants' })
  findAll(@Query() query: any) { return this.tenants.findAll(query); }

  @Get(':id')
  @RequirePermissions('tenant:read:global')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) { return this.tenants.findOne(id); }

  @Post()
  @RequirePermissions('tenant:create:global')
  @ApiOperation({ summary: 'Create tenant' })
  create(@Body() dto: any) { return this.tenants.create(dto); }

  @Patch(':id')
  @RequirePermissions('tenant:update:global')
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() dto: any) { return this.tenants.update(id, dto); }
}
