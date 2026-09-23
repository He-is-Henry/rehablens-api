import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'scheduledDate must be in YYYY-MM-DD format',
  })
  scheduledDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minSessions?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSessions?: number | null;
}
