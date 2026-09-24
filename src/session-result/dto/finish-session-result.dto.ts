import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FinishSessionResultDto {
  @IsInt()
  @Min(0)
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
