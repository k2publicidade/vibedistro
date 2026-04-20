import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { ProviderRegistryService } from '../integrations/provider-registry.service';
import { MemoryBufferService } from './memory-buffer.service';
import type { AssetType, AssetProcessingStatus } from '@vibedistro/database';

const ALLOWED_AUDIO_MIMES = [
  'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac',
  'audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/aiff', 'audio/x-aiff',
];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
];

const MAX_AUDIO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;  // 20MB

function detectAudioFormat(mime: string) {
  if (mime.includes('wav')) return 'WAV';
  if (mime.includes('flac')) return 'FLAC';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'MP3';
  if (mime.includes('aac')) return 'AAC';
  if (mime.includes('aiff')) return 'AIFF';
  return null;
}

function detectImageFormat(mime: string) {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG';
  if (mime.includes('png')) return 'PNG';
  if (mime.includes('webp')) return 'WEBP';
  return null;
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
    private readonly memoryBuffer: MemoryBufferService,
  ) {}

  async upload(
    tenantId: string,
    userId: string,
    assetType: 'AUDIO' | 'COVER_ART' | 'ARTIST_PHOTO' | 'DOCUMENT',
    file: Express.Multer.File,
  ) {
    // Validate
    if (assetType === 'AUDIO') {
      if (!ALLOWED_AUDIO_MIMES.includes(file.mimetype)) {
        throw new BadRequestException(`Formato de audio nao suportado: ${file.mimetype}. Use WAV, FLAC, MP3, AAC ou AIFF.`);
      }
      if (file.size > MAX_AUDIO_SIZE) {
        throw new BadRequestException('Arquivo de audio excede 200MB.');
      }
    } else if (assetType === 'COVER_ART' || assetType === 'ARTIST_PHOTO') {
      if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
        throw new BadRequestException(`Formato de imagem nao suportado: ${file.mimetype}. Use JPEG, PNG ou WebP.`);
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException('Imagem excede 20MB.');
      }
    } else if (assetType === 'DOCUMENT') {
      throw new BadRequestException('Upload de documentos ainda nao suportado (Revelator nao expoe endpoint).');
    }

    const provider = this.providerRegistry.getDefaultProvider();
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Stream to Revelator (pass-through). Provider returns the fileId we persist.
    let fileId: string;
    try {
      if (assetType === 'AUDIO') {
        const ref = await provider.uploadAudio(file.buffer, file.originalname, file.mimetype);
        fileId = ref.fileId;
      } else {
        const isCover = assetType === 'COVER_ART';
        const ref = await provider.uploadImage(file.buffer, file.originalname, file.mimetype, isCover);
        fileId = ref.fileId;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Revelator upload failed (${assetType}, ${file.originalname}): ${message}`);
      throw new BadRequestException(`Falha no upload ao Revelator: ${message}`);
    }

    // Create DB record — storageKey is the Revelator fileId
    const asset = await this.prisma.asset.create({
      data: {
        tenantId,
        uploadedById: userId,
        assetType: assetType as AssetType,
        processingStatus: 'COMPLETED' as AssetProcessingStatus,
        storageKey: fileId,
        storageProvider: 'revelator',
        storageBucket: `revelator-${provider.environment}`,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: BigInt(file.size),
        checksum,
        audioFormat: assetType === 'AUDIO' ? detectAudioFormat(file.mimetype) as any : null,
        imageFormat: (assetType === 'COVER_ART' || assetType === 'ARTIST_PHOTO')
          ? detectImageFormat(file.mimetype) as any : null,
        processedAt: new Date(),
      },
    });

    // Hold a short-lived copy in memory so the wizard can render preview/thumbnail.
    // Revelator does not publicly document a GET endpoint — this is the preview window.
    this.memoryBuffer.set(asset.id, file.buffer, file.mimetype, file.originalname);

    this.logger.log(`Asset uploaded: ${asset.id} → revelator fileId=${fileId} (${assetType}, ${file.originalname}, ${file.size}B)`);

    return {
      id: asset.id,
      assetType: asset.assetType,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      fileSizeBytes: Number(asset.fileSizeBytes),
      processingStatus: asset.processingStatus,
      createdAt: asset.createdAt.toISOString(),
    };
  }

  async findOne(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset nao encontrado');
    return {
      ...asset,
      fileSizeBytes: Number(asset.fileSizeBytes),
    };
  }

  async getFileStream(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset nao encontrado');

    const cached = this.memoryBuffer.getStream(asset.id);
    if (!cached) {
      throw new NotFoundException(
        'Preview expirou (30min). O arquivo ja foi enviado ao Revelator e nao pode ser baixado de volta.',
      );
    }
    return {
      stream: cached.stream,
      mimeType: cached.mimeType,
      filename: cached.filename,
    };
  }

  async delete(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset nao encontrado');

    // Drop the preview buffer; the file stays in Revelator (they don't document a delete endpoint).
    this.memoryBuffer.delete(id);

    await this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
