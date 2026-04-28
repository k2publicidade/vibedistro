import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { RevelatorAccountService } from './revelator-account.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, RevelatorAccountService],
  exports: [OnboardingService, RevelatorAccountService],
})
export class OnboardingModule {}
