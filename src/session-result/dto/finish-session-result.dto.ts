import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FinishSessionResultDto {
  @IsString()
  scheduleId?: string;

  @IsString()
  assignmentId?: string;

  @IsInt()
  @Min(1)
  repsCompleted!: number;

  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsOptional()
  @IsEnum(['completed', 'abandoned'])
  status?: 'completed' | 'abandoned';

  @IsString()
  timeZone!: string;
}
