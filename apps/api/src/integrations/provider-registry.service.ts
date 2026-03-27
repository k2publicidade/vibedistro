import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  RevelatorProvider,
  RevelatorAuthClient,
  createRevelatorConfig,
} from '@vibedistro/integrations/revelator';
import type { DistributionProvider } from '@vibedistro/integrations';

/**
 * ProviderRegistryService — the single point of truth for provider instances.
 *
 * The rest of the application depends on DistributionProvider (interface),
 * never on RevelatorProvider (implementation). This service is the only
 * place that knows which concrete provider to instantiate.
 *
 * To add a new provider: implement DistributionProvider, register here.
 */
@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private revelator!: RevelatorProvider;

  async onModuleInit() {
    const config = createRevelatorConfig(process.env);

    const authClient = new RevelatorAuthClient(config);
    this.revelator = new RevelatorProvider(config, authClient);

    if (config.enabled) {
      const health = await this.revelator.healthCheck();
      if (health.healthy) {
        this.logger.log(`Revelator [${config.environment}] connected — ${health.latencyMs}ms`);
      } else {
        this.logger.warn(`Revelator [${config.environment}] health check failed: ${health.error}`);
      }
    } else {
      this.logger.warn(`Revelator [${config.environment}] DISABLED (PROVIDER_ENABLED=false)`);
    }
  }

  /** Returns the Revelator provider as a DistributionProvider interface. */
  getDefaultProvider(): DistributionProvider {
    return this.revelator;
  }

  /** Direct access for webhook verification (needs concrete type for signature check). */
  getRevelatorProvider(): RevelatorProvider {
    return this.revelator;
  }
}
