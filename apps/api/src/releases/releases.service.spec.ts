import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { PrismaService } from '../database/prisma.service';

const mockRelease = {
  id: 'rel-1',
  tenantId: 'tenant-1',
  artistId: 'artist-1',
  title: 'Test Single',
  status: 'DRAFT',
  releaseType: 'SINGLE',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  artist: { stageName: 'Test Artist' },
  releaseTracks: [],
  dspProfiles: [],
  countryRestrictions: [],
  externalMappings: [],
  approvalFlow: null,
};

describe('ReleasesService', () => {
  let service: ReleasesService;
  let prisma: {
    release: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    auditLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      release: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleasesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReleasesService>(ReleasesService);
  });

  describe('findAll', () => {
    it('should return paginated releases', async () => {
      prisma.release.findMany.mockResolvedValue([mockRelease]);
      prisma.release.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', { page: 1, perPage: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(prisma.release.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });

    it('should filter by status', async () => {
      prisma.release.findMany.mockResolvedValue([]);
      prisma.release.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { status: 'LIVE' });

      expect(prisma.release.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'LIVE' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a release by id', async () => {
      prisma.release.findFirst.mockResolvedValue(mockRelease);

      const result = await service.findOne('tenant-1', 'rel-1');
      expect(result.id).toBe('rel-1');
    });

    it('should throw NotFoundException for missing release', async () => {
      prisma.release.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a release with DRAFT status', async () => {
      prisma.release.create.mockResolvedValue(mockRelease);

      const result = await service.create('tenant-1', { title: 'New', artistId: 'a1', releaseType: 'SINGLE' }, 'user-1');
      expect(prisma.release.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-1', status: 'DRAFT', createdBy: 'user-1' }),
        }),
      );
    });
  });

  describe('transitionStatus', () => {
    it('should allow DRAFT -> PENDING_REVIEW', async () => {
      prisma.release.findFirst.mockResolvedValue(mockRelease);
      prisma.release.update.mockResolvedValue({ ...mockRelease, status: 'PENDING_REVIEW' });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.transitionStatus('tenant-1', 'rel-1', 'PENDING_REVIEW' as any, 'user-1');
      expect(result.status).toBe('PENDING_REVIEW');
    });

    it('should reject invalid transitions (DRAFT -> LIVE)', async () => {
      prisma.release.findFirst.mockResolvedValue(mockRelease);

      await expect(
        service.transitionStatus('tenant-1', 'rel-1', 'LIVE' as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should reject edits on LIVE releases', async () => {
      prisma.release.findFirst.mockResolvedValue({ ...mockRelease, status: 'LIVE' });

      await expect(
        service.update('tenant-1', 'rel-1', { title: 'New Name' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a DRAFT release', async () => {
      prisma.release.findFirst.mockResolvedValue(mockRelease);
      prisma.release.update.mockResolvedValue({ ...mockRelease, deletedAt: new Date() });

      await service.remove('tenant-1', 'rel-1', 'user-1');
      expect(prisma.release.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('should reject deleting LIVE releases', async () => {
      prisma.release.findFirst.mockResolvedValue({ ...mockRelease, status: 'LIVE' });

      await expect(service.remove('tenant-1', 'rel-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
