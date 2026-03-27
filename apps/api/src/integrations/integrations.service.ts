import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProviderRegistryService } from './provider-registry.service.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  async getHealth(tenantId: string) {
    const provider = this.providerRegistry.getDefaultProvider();
    const health = await provider.healthCheck();
    return { provider: provider.providerName, environment: provider.environment, ...health };
  }

  async listFailedWebhooks(tenantId: string, query: { page?: number; perPage?: number }) {
    const { page = 1, perPage = 20 } = query;
    const skip = (page - 1) * perPage;
    const where = { tenantId, status: 'FAILED' as const };
    const [data, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      this.prisma.webhookEvent.count({ where }),
    ]);
    return { data, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async retryWebhook(tenantId: string, eventId: string) {
    const event = await this.prisma.webhookEvent.findFirst({ where: { id: eventId, tenantId } });
    if (!event) throw new NotFoundException('Webhook event not found');
    return this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'RECEIVED', failureReason: null, nextRetryAt: new Date() },
    });
  }

  async listExternalMappings(tenantId: string, query: { entityType?: string; syncStatus?: string }) {
    return this.prisma.externalMapping.findMany({
      where: {
        tenantId,
        ...(query.entityType && { entityType: query.entityType }),
        ...(query.syncStatus && { syncStatus: query.syncStatus as any }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }
}
