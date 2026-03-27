import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoyaltiesService } from './royalties.service.js';
@ApiTags('royalties') @ApiBearerAuth() @Controller('royalties')
export class RoyaltiesController {
  constructor(private readonly service: RoyaltiesService) {}
}
