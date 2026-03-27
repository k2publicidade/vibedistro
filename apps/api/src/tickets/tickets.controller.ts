import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service.js';
@ApiTags('tickets') @ApiBearerAuth() @Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}
}
