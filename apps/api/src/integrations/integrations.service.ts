import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProviderRegistryService } from './provider-registry.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  async getHealth(tenantId: string) {
    const provider = this.providerRegistry.getDefaultProvider();
    const health = await provider.healthCheck();
    return {
      provider: provider.providerName,
      environment: provider.environment,
      status: health.healthy ? 'healthy' : 'unhealthy',
      latency: health.latencyMs ?? 0,
      healthy: health.healthy,
      checkedAt: health.checkedAt,
      error: health.error,
    };
  }

  async listFailedWebhooks(tenantId: string, query: { page?: number; perPage?: number }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
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

  async getStatus(tenantId: string) {
    const [connection, pendingJobs] = await Promise.all([
      this.prisma.integrationConnection.findFirst({
        where: { tenantId, enabled: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.jobExecution.count({
        where: { tenantId, status: { in: ['QUEUED', 'RUNNING'] } },
      }),
    ]);

    return {
      connected: !!connection?.enabled,
      connection: connection
        ? {
            id: connection.id,
            provider: connection.provider,
            environment: connection.environment,
            enabled: connection.enabled,
            lastHealthCheckAt: connection.lastHealthCheckAt,
            lastHealthCheckOk: connection.lastHealthCheckOk,
            lastHealthCheckError: connection.lastHealthCheckError,
          }
        : null,
      pendingJobs,
    };
  }

  async getSyncHistory(tenantId: string, query: { type?: string; page?: number; perPage?: number }) {
    const { type } = query;
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ...(type && { jobName: type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.jobExecution.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobExecution.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }
}
