import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
@ApiTags('assets') @ApiBearerAuth() @Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}
}
