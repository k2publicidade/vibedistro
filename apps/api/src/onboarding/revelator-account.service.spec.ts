import { BadRequestException } from '@nestjs/common';
import { RevelatorAccountService } from './revelator-account.service';

const post = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => post(...args),
  },
}));

describe('RevelatorAccountService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      REVELATOR_API_URL: 'https://api.revelator.com',
      REVELATOR_PARTNER_API_KEY: 'partner-key',
      REVELATOR_TIMEOUT_MS: '30000',
      REVELATOR_WHITE_LABEL_URL: 'https://label.example.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a child account with stable partnerUserId', async () => {
    post.mockResolvedValueOnce({
      data: {
        enterpriseId: 123,
        userId: 456,
        email: 'owner@example.com',
      },
    });

    const service = new RevelatorAccountService();

    const result = await service.signupChildAccount({
      tenantName: 'Acme Label',
      ownerEmail: 'owner@example.com',
      ownerFirstName: 'Ada',
      ownerLastName: 'Lovelace',
      partnerUserId: 'user_123',
      accountType: 'label',
    });

    expect(post).toHaveBeenCalledWith(
      'https://api.revelator.com/partner/account/signup',
      expect.objectContaining({
        partnerApiKey: 'partner-key',
        partnerUserId: 'user_123',
        email: 'owner@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        companyName: 'Acme Label',
        accountType: 'label',
      }),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 30000,
      }),
    );
    expect(result).toEqual({
      enterpriseId: '123',
      revelatorUserId: '456',
      email: 'owner@example.com',
    });
  });

  it('builds an authorize URL using unprompted login token', async () => {
    post.mockResolvedValueOnce({ data: { accessToken: 'token-abc' } });
    const service = new RevelatorAccountService();

    const url = await service.createAuthorizeUrl({
      partnerUserId: 'user_123',
      redirectUrl: 'https://label.example.com/catalog',
    });

    expect(post).toHaveBeenCalledWith(
      'https://api.revelator.com/partner/account/login',
      { partnerApiKey: 'partner-key', partnerUserId: 'user_123' },
      expect.any(Object),
    );
    expect(url).toBe(
      'https://label.example.com/authorize?token=token-abc&redirectUrl=https%3A%2F%2Flabel.example.com%2Fcatalog',
    );
  });

  it('uses white-label root as default redirect URL', async () => {
    post.mockResolvedValueOnce({ data: { token: 'token-abc' } });
    const service = new RevelatorAccountService();

    const url = await service.createAuthorizeUrl({ partnerUserId: 'user_123' });

    expect(url).toBe(
      'https://label.example.com/authorize?token=token-abc&redirectUrl=https%3A%2F%2Flabel.example.com',
    );
  });

  it('rejects redirect URLs outside configured white-label domain', async () => {
    const service = new RevelatorAccountService();

    await expect(
      service.createAuthorizeUrl({
        partnerUserId: 'user_123',
        redirectUrl: 'https://evil.example.com/catalog',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(post).not.toHaveBeenCalled();
  });

  it('classifies transient Revelator failures as retryable', () => {
    const service = new RevelatorAccountService();
    const error = { response: { status: 503, data: { message: 'Unavailable' } } };

    expect(service.classifyError(error)).toEqual({
      retryable: true,
      message: 'Revelator unavailable. Try again later.',
    });
  });

  it('classifies validation conflicts as manual review', () => {
    const service = new RevelatorAccountService();
    const error = { response: { status: 409, data: { message: 'Email already exists' } } };

    expect(service.classifyError(error)).toEqual({
      retryable: false,
      message: 'Revelator rejected the account data.',
    });
  });
});
