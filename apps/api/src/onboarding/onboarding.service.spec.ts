import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnboardingService } from './onboarding.service';
import { PROVISIONING_STATUS } from './onboarding.constants';

const tenantCreate = jest.fn();
const tenantFindUnique = jest.fn();
const tenantUpdate = jest.fn();
const userCreate = jest.fn();
const userFindUnique = jest.fn();
const userTenantCreate = jest.fn();
const roleFindFirst = jest.fn();
const integrationConnectionCreate = jest.fn();
const integrationConnectionFindFirst = jest.fn();
const integrationConnectionUpdate = jest.fn();
const externalMappingCreateMany = jest.fn();
const refreshTokenCreate = jest.fn();
const transaction = jest.fn();

const prisma = {
  tenant: { create: tenantCreate, findUnique: tenantFindUnique, update: tenantUpdate },
  user: { create: userCreate, findUnique: userFindUnique },
  userTenant: { create: userTenantCreate },
  role: { findFirst: roleFindFirst },
  integrationConnection: {
    create: integrationConnectionCreate,
    findFirst: integrationConnectionFindFirst,
    update: integrationConnectionUpdate,
  },
  externalMapping: { createMany: externalMappingCreateMany },
  refreshToken: { create: refreshTokenCreate },
  $transaction: transaction,
};

const revelatorAccount = {
  signupChildAccount: jest.fn(),
  classifyError: jest.fn(),
  createAuthorizeUrl: jest.fn(),
};

describe('OnboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['REVELATOR_WHITE_LABEL_URL'] = 'https://label.example.com';
    delete process.env['REVELATOR_ENVIRONMENT'];

    tenantFindUnique.mockResolvedValue(null);
    userFindUnique.mockResolvedValue(null);
    roleFindFirst.mockResolvedValue({
      id: 'role-owner',
      slug: 'label_owner',
      permissions: [
        {
          permission: { resource: 'integration', action: 'read', scope: 'tenant' },
        },
      ],
    });
    tenantCreate.mockResolvedValue({ id: 'tenant-1', slug: 'acme', name: 'Acme' });
    userCreate.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    userTenantCreate.mockResolvedValue({});
    integrationConnectionCreate.mockResolvedValue({ id: 'conn-1' });
    integrationConnectionFindFirst.mockResolvedValue(null);
    integrationConnectionUpdate.mockResolvedValue({});
    externalMappingCreateMany.mockResolvedValue({ count: 2 });
    refreshTokenCreate.mockResolvedValue({});
    tenantUpdate.mockResolvedValue({});
    transaction.mockImplementation(async (callback) => callback(prisma));
  });

  const service = () =>
    new OnboardingService(
      prisma as never,
      revelatorAccount as never,
      new JwtService({ secret: 'test-secret' }),
    );

  it('creates local tenant and provisions Revelator child account', async () => {
    revelatorAccount.signupChildAccount.mockResolvedValue({
      enterpriseId: 'ent-1',
      revelatorUserId: 'rev-user-1',
      email: 'owner@example.com',
    });

    const result = await service().createWhiteLabelTenant({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      ownerEmail: 'owner@example.com',
      ownerFirstName: 'Ada',
      ownerLastName: 'Lovelace',
      password: 'very-secure-password',
      accountType: 'label',
    });

    expect(revelatorAccount.signupChildAccount).toHaveBeenCalledWith({
      tenantName: 'Acme',
      ownerEmail: 'owner@example.com',
      ownerFirstName: 'Ada',
      ownerLastName: 'Lovelace',
      partnerUserId: 'user-1',
      accountType: 'label',
    });
    expect(integrationConnectionUpdate).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({
        enabled: true,
        config: expect.objectContaining({
          enterpriseId: 'ent-1',
          revelatorUserId: 'rev-user-1',
          partnerUserId: 'user-1',
          provisioningStatus: PROVISIONING_STATUS.active,
        }),
      }),
    });
    expect(externalMappingCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ entityType: 'tenant', tenantId: 'tenant-1', externalId: 'ent-1' }),
        expect.objectContaining({ entityType: 'user', tenantId: 'tenant-1', externalId: 'rev-user-1' }),
      ]),
      skipDuplicates: true,
    });
    expect(tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { status: 'ACTIVE' },
    });
    expect(result.provisioningStatus).toBe(PROVISIONING_STATUS.active);
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshTokenCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-1',
      }),
    });
  });

  it('leaves tenant in setup when Revelator provisioning fails retryably', async () => {
    revelatorAccount.signupChildAccount.mockRejectedValue(new Error('timeout'));
    revelatorAccount.classifyError.mockReturnValue({
      retryable: true,
      message: 'Revelator unavailable. Try again later.',
    });

    const result = await service().createWhiteLabelTenant({
      tenantName: 'Acme',
      tenantSlug: 'acme',
      ownerEmail: 'owner@example.com',
      password: 'very-secure-password',
    });

    expect(integrationConnectionUpdate).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({
        enabled: false,
        config: expect.objectContaining({
          provisioningStatus: PROVISIONING_STATUS.failedRetryable,
          lastProvisioningError: 'Revelator unavailable. Try again later.',
        }),
      }),
    });
    expect(tenantUpdate).not.toHaveBeenCalled();
    expect(result.provisioningStatus).toBe(PROVISIONING_STATUS.failedRetryable);
  });

  it('rejects duplicate tenant slugs and owner emails', async () => {
    tenantFindUnique.mockResolvedValueOnce({ id: 'existing' });

    await expect(
      service().createWhiteLabelTenant({
        tenantName: 'Acme',
        tenantSlug: 'acme',
        ownerEmail: 'owner@example.com',
        password: 'very-secure-password',
      }),
    ).rejects.toThrow(ConflictException);

    tenantFindUnique.mockResolvedValueOnce(null);
    userFindUnique.mockResolvedValueOnce({ id: 'existing-user' });

    await expect(
      service().createWhiteLabelTenant({
        tenantName: 'Acme',
        tenantSlug: 'acme-2',
        ownerEmail: 'owner@example.com',
        password: 'very-secure-password',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns pending local status when there is no connection', async () => {
    integrationConnectionFindFirst.mockResolvedValue(null);

    await expect(service().getStatus('tenant-1')).resolves.toEqual({
      connected: false,
      provisioningStatus: PROVISIONING_STATUS.pendingLocal,
      lastProvisioningError: null,
    });
  });
});
