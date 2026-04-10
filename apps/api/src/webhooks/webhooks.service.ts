import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProviderRegistryService } from '../integrations/provider-registry.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  async handleRevelatorWebhook(
    rawBody: Buffer,
    signature: string,
    environment: string,
  ): Promise<void> {
    const provider = this.providerRegistry.getRevelatorProvider();

    // 1. Verify signature (replay protection)
    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Webhook signature verification failed');
      throw new BadRequestException('Invalid signature');
    }

    const rawPayload = JSON.parse(rawBody.toString()) as unknown;

    // 2. Idempotency check
    const idempotencyKey = this.extractIdempotencyKey(rawPayload);
    if (idempotencyKey) {
      const existing = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
      if (existing) {
        this.logger.log(`Duplicate webhook skipped: ${idempotencyKey}`);
        return;
      }
    }

    // 3. Persist event for async processing
    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: 'revelator',
        environment: environment as any,
        eventType: this.extractEventType(rawPayload),
        payload: rawPayload as any,
        rawPayload: rawBody,
        signature,
        status: 'RECEIVED',
        idempotencyKey,
      },
    });

    this.logger.log(`Webhook received: ${event.eventType} [${event.id}]`);
    // Actual processing delegated to worker via BullMQ job
    // The worker picks up RECEIVED events and processes them
  }

  private extractEventType(payload: unknown): string {
    const p = payload as Record<string, unknown>;
    return String(p['event_type'] ?? p['type'] ?? 'unknown');
  }

  private extractIdempotencyKey(payload: unknown): string | undefined {
    const p = payload as Record<string, unknown>;
    const key = p['idempotency_key'] ?? p['event_id'] ?? p['id'];
    return key ? `revelator:${key}` : undefined;
  }
}
