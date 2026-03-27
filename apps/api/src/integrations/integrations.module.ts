import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';
import { ProviderRegistryService } from './provider-registry.service.js';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, ProviderRegistryService],
  exports: [IntegrationsService, ProviderRegistryService],
})
export class IntegrationsModule {}
