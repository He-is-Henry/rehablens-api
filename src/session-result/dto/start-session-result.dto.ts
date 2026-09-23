import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class StartSessionResultDto {
  @IsString()
  @IsNotEmpty()
  assignmentId!: string;

  @IsString()
  @IsNotEmpty()
  scheduleId!: string;

  @IsString()
  @IsOptional()
  timeZone?: string;
}
