import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
