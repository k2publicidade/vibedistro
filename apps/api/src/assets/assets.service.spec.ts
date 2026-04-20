import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { PrismaService } from '../database/prisma.service';
import { ProviderRegistryService } from '../integrations/provider-registry.service';
import { MemoryBufferService } from './memory-buffer.service';

const mockFile = (mimetype: string, size: number): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test-track.wav',
  encoding: '7bit',
  mimetype,
  buffer: Buffer.alloc(1024),
  size,
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
});

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: { asset: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock } };
  let provider: { uploadAudio: jest.Mock; uploadImage: jest.Mock; environment: string };
  let providerRegistry: { getDefaultProvider: jest.Mock };
  let memoryBuffer: { set: jest.Mock; get: jest.Mock; getStream: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    prisma = {
      asset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    provider = {
      environment: 'sandbox',
      uploadAudio: jest.fn().mockResolvedValue({ fileId: 'rev-audio-1', filename: 'test-track.wav' }),
      uploadImage: jest.fn().mockResolvedValue({ fileId: 'rev-image-1', filename: 'cover.jpg' }),
    };

    providerRegistry = {
      getDefaultProvider: jest.fn().mockReturnValue(provider),
    };

    memoryBuffer = {
      set: jest.fn(),
      get: jest.fn(),
      getStream: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProviderRegistryService, useValue: providerRegistry },
        { provide: MemoryBufferService, useValue: memoryBuffer },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  describe('upload', () => {
    it('should upload a valid WAV audio file via Revelator', async () => {
      const file = mockFile('audio/wav', 5 * 1024 * 1024);
      prisma.asset.create.mockResolvedValue({
        id: 'asset-1',
        assetType: 'AUDIO',
        originalFilename: 'test-track.wav',
        mimeType: 'audio/wav',
        fileSizeBytes: BigInt(5 * 1024 * 1024),
        processingStatus: 'COMPLETED',
        createdAt: new Date(),
      });

      const result = await service.upload('tenant-1', 'user-1', 'AUDIO', file);

      expect(result.id).toBe('asset-1');
      expect(provider.uploadAudio).toHaveBeenCalledWith(file.buffer, 'test-track.wav', 'audio/wav');
      expect(memoryBuffer.set).toHaveBeenCalledWith('asset-1', file.buffer, 'audio/wav', 'test-track.wav');
      expect(prisma.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storageKey: 'rev-audio-1',
            storageProvider: 'revelator',
            storageBucket: 'revelator-sandbox',
          }),
        }),
      );
    });

    it('should reject unsupported audio format', async () => {
      const file = mockFile('audio/ogg', 1024);
      await expect(service.upload('tenant-1', 'user-1', 'AUDIO', file)).rejects.toThrow(BadRequestException);
      expect(provider.uploadAudio).not.toHaveBeenCalled();
    });

    it('should reject audio files over 200MB', async () => {
      const file = mockFile('audio/wav', 201 * 1024 * 1024);
      await expect(service.upload('tenant-1', 'user-1', 'AUDIO', file)).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported image format for COVER_ART', async () => {
      const file = mockFile('image/gif', 1024);
      await expect(service.upload('tenant-1', 'user-1', 'COVER_ART', file)).rejects.toThrow(BadRequestException);
    });

    it('should reject DOCUMENT uploads (Revelator has no endpoint)', async () => {
      const file = mockFile('application/pdf', 1024);
      await expect(service.upload('tenant-1', 'user-1', 'DOCUMENT', file)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid JPEG for COVER_ART with cover=true', async () => {
      const file = mockFile('image/jpeg', 2 * 1024 * 1024);
      file.originalname = 'cover.jpg';
      prisma.asset.create.mockResolvedValue({
        id: 'asset-2',
        assetType: 'COVER_ART',
        originalFilename: 'cover.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: BigInt(2 * 1024 * 1024),
        processingStatus: 'COMPLETED',
        createdAt: new Date(),
      });

      const result = await service.upload('tenant-1', 'user-1', 'COVER_ART', file);

      expect(result.id).toBe('asset-2');
      expect(provider.uploadImage).toHaveBeenCalledWith(file.buffer, 'cover.jpg', 'image/jpeg', true);
    });

    it('should pass isCover=false for ARTIST_PHOTO', async () => {
      const file = mockFile('image/png', 1 * 1024 * 1024);
      file.originalname = 'artist.png';
      prisma.asset.create.mockResolvedValue({
        id: 'asset-3',
        assetType: 'ARTIST_PHOTO',
        originalFilename: 'artist.png',
        mimeType: 'image/png',
        fileSizeBytes: BigInt(1 * 1024 * 1024),
        processingStatus: 'COMPLETED',
        createdAt: new Date(),
      });

      await service.upload('tenant-1', 'user-1', 'ARTIST_PHOTO', file);

      expect(provider.uploadImage).toHaveBeenCalledWith(file.buffer, 'artist.png', 'image/png', false);
    });

    it('should surface Revelator upload failures as BadRequestException', async () => {
      const file = mockFile('audio/wav', 1024);
      provider.uploadAudio.mockRejectedValue(new Error('Revelator 500'));
      await expect(service.upload('tenant-1', 'user-1', 'AUDIO', file)).rejects.toThrow(BadRequestException);
      expect(prisma.asset.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for missing asset', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);
      await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFileStream', () => {
    it('should return stream from memory buffer', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', storageKey: 'rev-1' });
      memoryBuffer.getStream.mockReturnValue({
        stream: { pipe: jest.fn() },
        mimeType: 'audio/wav',
        filename: 'track.wav',
      });

      const result = await service.getFileStream('tenant-1', 'asset-1');
      expect(result.mimeType).toBe('audio/wav');
      expect(memoryBuffer.getStream).toHaveBeenCalledWith('asset-1');
    });

    it('should throw when buffer expired', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', storageKey: 'rev-1' });
      memoryBuffer.getStream.mockReturnValue(null);
      await expect(service.getFileStream('tenant-1', 'asset-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft-delete asset and evict memory buffer', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', storageKey: 'rev-1' });
      prisma.asset.update.mockResolvedValue({});

      await service.delete('tenant-1', 'asset-1');

      expect(memoryBuffer.delete).toHaveBeenCalledWith('asset-1');
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });
  });
});
