import { Controller, Post, Headers, Req, RawBodyRequest, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';
import type { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  /**
   * Revelator webhook endpoint — environment-specific to isolate sandbox/production events.
   * URL: POST /api/v1/webhooks/revelator/:env
   */
  @Post('revelator/:env')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Revelator webhook events' })
  async revelator(
    @Param('env') env: string,
    @Headers('x-revelator-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      return { received: false, reason: 'no_body' };
    }
    await this.webhooks.handleRevelatorWebhook(req.rawBody, signature, env.toUpperCase());
    return { received: true };
  }
}
