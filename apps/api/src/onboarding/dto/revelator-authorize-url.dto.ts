import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevelatorAuthorizeUrlDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  redirectUrl?: string;
}
