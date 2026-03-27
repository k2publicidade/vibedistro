import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
@ApiTags('analytics') @ApiBearerAuth() @Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}
}
