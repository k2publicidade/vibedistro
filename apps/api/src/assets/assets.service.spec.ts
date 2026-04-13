import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from './storage.service';

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
  let storage: { store: jest.Mock; getStream: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    prisma = {
      asset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    storage = {
      store: jest.fn().mockResolvedValue({
        storageKey: 'tenant-1/audio/abc-123.wav',
        storageBucket: 'vibedistro-local',
        storageProvider: 'local',
        fileSizeBytes: 1024,
        checksum: 'abc123',
      }),
      getStream: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  describe('upload', () => {
    it('should upload a valid WAV audio file', async () => {
      const file = mockFile('audio/wav', 5 * 1024 * 1024);
      prisma.asset.create.mockResolvedValue({
        id: 'asset-1',
        assetType: 'AUDIO',
        originalFilename: 'test-track.wav',
        mimeType: 'audio/wav',
        fileSizeBytes: BigInt(1024),
        processingStatus: 'COMPLETED',
        createdAt: new Date(),
      });

      const result = await service.upload('tenant-1', 'user-1', 'AUDIO', file);
      expect(result.id).toBe('asset-1');
      expect(storage.store).toHaveBeenCalledWith('tenant-1', 'audio', file);
    });

    it('should reject unsupported audio format', async () => {
      const file = mockFile('audio/ogg', 1024);
      await expect(service.upload('tenant-1', 'user-1', 'AUDIO', file)).rejects.toThrow(BadRequestException);
    });

    it('should reject audio files over 200MB', async () => {
      const file = mockFile('audio/wav', 201 * 1024 * 1024);
      await expect(service.upload('tenant-1', 'user-1', 'AUDIO', file)).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported image format for COVER_ART', async () => {
      const file = mockFile('image/gif', 1024);
      await expect(service.upload('tenant-1', 'user-1', 'COVER_ART', file)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid JPEG for COVER_ART', async () => {
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
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for missing asset', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);
      await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft-delete and remove file from storage', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', storageKey: 'key-1' });
      prisma.asset.update.mockResolvedValue({});
      storage.delete.mockResolvedValue(undefined);

      await service.delete('tenant-1', 'asset-1');
      expect(storage.delete).toHaveBeenCalledWith('key-1');
      expect(prisma.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });
  });
});
