import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateWhiteLabelOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tenantName!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MinLength(3)
  @MaxLength(64)
  tenantSlug!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ownerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ownerLastName?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  accountType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  primaryColor?: string;
}
