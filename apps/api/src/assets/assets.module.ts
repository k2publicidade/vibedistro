import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { MemoryBufferService } from './memory-buffer.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [AssetsController],
  providers: [AssetsService, MemoryBufferService],
  exports: [AssetsService, MemoryBufferService],
})
export class AssetsModule {}
