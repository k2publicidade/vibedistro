import {
  Controller, Get, Post, Delete, Param, Res,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { AssetsService } from './assets.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post('upload')
  @RequirePermissions('asset:create:tenant')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an asset (audio, cover art, artist photo, document)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        assetType: { type: 'string', enum: ['AUDIO', 'COVER_ART', 'ARTIST_PHOTO', 'DOCUMENT'] },
      },
    },
  })
  upload(
    @CurrentUser() user: SessionUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('assetType') assetType: 'AUDIO' | 'COVER_ART' | 'ARTIST_PHOTO' | 'DOCUMENT',
  ) {
    return this.assets.upload(user.tenantId, user.id, assetType, file);
  }

  @Get(':id')
  @RequirePermissions('asset:read:tenant')
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.assets.findOne(user.tenantId, id);
  }

  @Get(':id/file')
  @RequirePermissions('asset:read:tenant')
  @ApiOperation({ summary: 'Download the original file' })
  async download(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType, filename } = await this.assets.getFileStream(user.tenantId, id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'private, max-age=3600',
    });
    stream.pipe(res);
  }

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Get image thumbnail (serves original for now)' })
  async thumbnail(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType } = await this.assets.getFileStream(user.tenantId, id);
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    });
    stream.pipe(res);
  }

  @Delete(':id')
  @RequirePermissions('asset:delete:tenant')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.assets.delete(user.tenantId, id);
  }
}
