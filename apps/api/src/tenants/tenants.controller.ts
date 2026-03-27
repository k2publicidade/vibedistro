import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @RequirePermissions('tenant:read:global')
  findAll(@Query() query: any) { return this.tenants.findAll(query); }

  @Get(':id')
  @RequirePermissions('tenant:read:global')
  findOne(@Param('id') id: string) { return this.tenants.findOne(id); }

  @Post()
  @RequirePermissions('tenant:create:global')
  create(@Body() dto: any) { return this.tenants.create(dto); }

  @Patch(':id')
  @RequirePermissions('tenant:update:global')
  update(@Param('id') id: string, @Body() dto: any) { return this.tenants.update(id, dto); }
}
