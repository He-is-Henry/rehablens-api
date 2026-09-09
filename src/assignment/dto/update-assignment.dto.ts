import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  status?: 'active' | 'completed' | 'paused' | 'archived';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customReps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  customHoldSecs?: number;
}
