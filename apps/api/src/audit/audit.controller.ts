import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermissions('audit:read:tenant')
  @ApiOperation({ summary: 'Paginated audit log' })
  findAll(@CurrentUser() user: SessionUser, @Query() query: any) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get('actions')
  @RequirePermissions('audit:read:tenant')
  @ApiOperation({ summary: 'List distinct audit actions' })
  actions(@CurrentUser() user: SessionUser) {
    return this.service.getDistinctActions(user.tenantId);
  }
}
