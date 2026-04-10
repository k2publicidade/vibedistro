import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across entities' })
  search(@CurrentUser() user: SessionUser, @Query('q') q: string) {
    return this.service.search(user.tenantId, q);
  }
}
