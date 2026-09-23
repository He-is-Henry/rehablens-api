import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSessionResultDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  repsCompleted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsEnum(['in_progress', 'completed', 'abandoned'])
  status?: 'in_progress' | 'completed' | 'abandoned';

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}
