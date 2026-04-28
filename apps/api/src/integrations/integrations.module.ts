import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ProviderRegistryService } from './provider-registry.service';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [OnboardingModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, ProviderRegistryService],
  exports: [IntegrationsService, ProviderRegistryService],
})
export class IntegrationsModule {}
