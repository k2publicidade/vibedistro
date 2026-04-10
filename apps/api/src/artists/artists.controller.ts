import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import type { SessionUser, PaginationQuery } from '@vibedistro/types';

@ApiTags('artists')
@ApiBearerAuth()
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  @RequirePermissions('artist:read:tenant')
  @ApiOperation({ summary: 'List artists in tenant' })
  findAll(@CurrentUser() user: SessionUser, @Query() query: PaginationQuery) {
    return this.artists.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('artist:read:tenant')
  @ApiOperation({ summary: 'Get artist by ID' })
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.artists.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('artist:create:tenant')
  @ApiOperation({ summary: 'Create artist' })
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateArtistDto) {
    return this.artists.create(user.tenantId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('artist:update:tenant')
  @ApiOperation({ summary: 'Update artist' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateArtistDto,
  ) {
    return this.artists.update(user.tenantId, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('artist:delete:tenant')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete artist' })
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.artists.remove(user.tenantId, id, user.id);
  }
}
