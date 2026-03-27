import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
@ApiTags('audit') @ApiBearerAuth() @Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}
}
