import { IsEnum, IsInt, IsMongoId, Min } from 'class-validator';

export class CreateSessionResultDto {
  @IsMongoId()
  assignmentId!: string;

  @IsInt()
  @Min(0)
  repsCompleted!: number;

  @IsInt()
  @Min(1)
  targetReps!: number;

  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsEnum(['completed', 'abandoned'])
  status!: 'completed' | 'abandoned';
}
