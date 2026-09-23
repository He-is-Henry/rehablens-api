import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSessionResultDto {
  @IsString()
  @IsNotEmpty()
  assignmentId!: string;

  @IsString()
  @IsNotEmpty()
  scheduleId!: string;

  @IsInt()
  @Min(1)
  targetReps!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  repsCompleted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsEnum(['in_progress', 'completed', 'abandoned'])
  status!: 'in_progress' | 'completed' | 'abandoned';
}
