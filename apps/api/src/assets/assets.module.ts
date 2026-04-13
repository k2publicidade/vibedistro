import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { StorageService } from './storage.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, StorageService],
  exports: [AssetsService, StorageService],
})
export class AssetsModule {}
