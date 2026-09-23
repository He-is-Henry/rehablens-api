import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateScheduleEntryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'scheduledDate must be in YYYY-MM-DD format',
  })
  scheduledDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minSessions?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSessions?: number | null;
}

export class CreateSchedulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleEntryDto)
  entries!: CreateScheduleEntryDto[];
}
