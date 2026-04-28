import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { createRevelatorConfig } from '@vibedistro/integrations/revelator';

export interface SignupChildAccountInput {
  tenantName: string;
  ownerEmail: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  partnerUserId: string;
  accountType: string;
}

export interface SignupChildAccountResult {
  enterpriseId: string;
  revelatorUserId: string;
  email: string;
}

export interface CreateAuthorizeUrlInput {
  partnerUserId: string;
  redirectUrl?: string;
}

export interface ClassifiedRevelatorError {
  retryable: boolean;
  message: string;
}

@Injectable()
export class RevelatorAccountService {
  private readonly config = createRevelatorConfig(process.env);

  async signupChildAccount(
    input: SignupChildAccountInput,
  ): Promise<SignupChildAccountResult> {
    const { data } = await axios.post(
      `${this.config.baseUrl}/partner/account/signup`,
      {
        partnerApiKey: this.config.partnerApiKey,
        partnerUserId: input.partnerUserId,
        email: input.ownerEmail,
        firstName: input.ownerFirstName,
        lastName: input.ownerLastName,
        companyName: input.tenantName,
        accountType: input.accountType,
      },
      this.requestOptions(),
    );

    const enterpriseId = data?.enterpriseId;
    const revelatorUserId = data?.revelatorUserId ?? data?.userId;

    if (!enterpriseId || !revelatorUserId) {
      throw new Error('Revelator signup response missing enterpriseId or userId.');
    }

    return {
      enterpriseId: String(enterpriseId),
      revelatorUserId: String(revelatorUserId),
      email: String(data?.email ?? input.ownerEmail),
    };
  }

  async createAuthorizeUrl(input: CreateAuthorizeUrlInput): Promise<string> {
    const whiteLabelUrl = process.env.REVELATOR_WHITE_LABEL_URL;

    if (!whiteLabelUrl) {
      throw new Error('REVELATOR_WHITE_LABEL_URL is required.');
    }

    const authorizeUrl = new URL('/authorize', whiteLabelUrl);
    const whiteLabelOrigin = authorizeUrl.origin;
    const redirectUrl = input.redirectUrl ?? whiteLabelUrl;

    let parsedRedirectUrl: URL;

    try {
      parsedRedirectUrl = new URL(redirectUrl);
    } catch {
      throw new BadRequestException('Invalid redirect URL.');
    }

    if (parsedRedirectUrl.origin !== whiteLabelOrigin) {
      throw new BadRequestException('Invalid redirect URL.');
    }

    const { data } = await axios.post(
      `${this.config.baseUrl}/partner/account/login`,
      {
        partnerApiKey: this.config.partnerApiKey,
        partnerUserId: input.partnerUserId,
      },
      this.requestOptions(),
    );

    const token = data?.accessToken ?? data?.token;

    if (!token) {
      throw new Error('Revelator login response missing token.');
    }

    authorizeUrl.searchParams.set('token', String(token));
    authorizeUrl.searchParams.set('redirectUrl', redirectUrl);

    return authorizeUrl.toString();
  }

  classifyError(error: unknown): ClassifiedRevelatorError {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const retryable = status === 408 || status === 429 || Boolean(status && status >= 500);

    if (retryable) {
      return {
        retryable: true,
        message: 'Revelator unavailable. Try again later.',
      };
    }

    return {
      retryable: false,
      message: 'Revelator rejected the account data.',
    };
  }

  private requestOptions() {
    return {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: this.config.timeoutMs,
    };
  }
}
