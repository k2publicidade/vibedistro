import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArtistDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  legalName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  stageName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isni?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipiNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proAffiliation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spotifyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appleMusicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  websiteUrl?: string;
}
