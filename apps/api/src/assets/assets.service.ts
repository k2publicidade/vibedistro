import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from './storage.service';
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
    private readonly storage: StorageService,
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
    }

    // Store file
    const stored = await this.storage.store(tenantId, assetType.toLowerCase(), file);

    // Create DB record
    const asset = await this.prisma.asset.create({
      data: {
        tenantId,
        uploadedById: userId,
        assetType: assetType as AssetType,
        processingStatus: 'COMPLETED' as AssetProcessingStatus,
        storageKey: stored.storageKey,
        storageProvider: stored.storageProvider,
        storageBucket: stored.storageBucket,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: BigInt(stored.fileSizeBytes),
        checksum: stored.checksum,
        audioFormat: assetType === 'AUDIO' ? detectAudioFormat(file.mimetype) as any : null,
        imageFormat: (assetType === 'COVER_ART' || assetType === 'ARTIST_PHOTO')
          ? detectImageFormat(file.mimetype) as any : null,
        processedAt: new Date(),
      },
    });

    this.logger.log(`Asset uploaded: ${asset.id} (${assetType}, ${file.originalname}, ${file.size} bytes)`);

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
    const stream = await this.storage.getStream(asset.storageKey);
    return { stream, mimeType: asset.mimeType, filename: asset.originalFilename };
  }

  async delete(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset nao encontrado');

    await this.storage.delete(asset.storageKey);
    await this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
