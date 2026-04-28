import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { SessionUser } from '@vibedistro/types';
import { CreateWhiteLabelOnboardingDto } from './dto/create-white-label-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Public()
  @Post('white-label')
  @ApiOperation({ summary: 'Create a white-label tenant owner and provision Revelator child account' })
  createWhiteLabelTenant(@Body() dto: CreateWhiteLabelOnboardingDto) {
    return this.onboarding.createWhiteLabelTenant(dto);
  }

  @Get('status')
  @ApiBearerAuth()
  @RequirePermissions('integration:read:tenant')
  @ApiOperation({ summary: 'Get current white-label onboarding status' })
  status(@CurrentUser() user: SessionUser) {
    return this.onboarding.getStatus(user.tenantId);
  }
}
