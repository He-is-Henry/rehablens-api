import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsMongoId()
  patientId!: string;

  @IsMongoId()
  exerciseId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customReps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  customHoldSeconds?: number;
}

export type CreateAssignmentInternal = CreateAssignmentDto & {
  hospitalId: string;
  assignedBy: string;
};

export type AssignmentStatus = 'active' | 'completed' | 'paused' | 'archived';
