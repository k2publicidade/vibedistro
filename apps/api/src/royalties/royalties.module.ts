import { Module } from '@nestjs/common';
import { RoyaltiesController } from './royalties.controller.js';
import { RoyaltiesService } from './royalties.service.js';
@Module({ controllers: [RoyaltiesController], providers: [RoyaltiesService] })
export class RoyaltiesModule {}
