import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LANDMARK_KEYS, type LandmarkKey } from 'src/common/types/landmark';

export class AngleCheckDto {
  @IsString() label!: string;
  @IsIn(LANDMARK_KEYS) a!: LandmarkKey;
  @IsIn(LANDMARK_KEYS) b!: LandmarkKey;
  @IsIn(LANDMARK_KEYS) c!: LandmarkKey;
}

export class RepTriggerDto {
  @IsIn(LANDMARK_KEYS) a!: LandmarkKey;
  @IsIn(LANDMARK_KEYS) b!: LandmarkKey;
  @IsIn(LANDMARK_KEYS) c!: LandmarkKey;
  @IsInt() @Min(0) @Max(180) targetAngle!: number;
  @IsIn(['above', 'below']) targetDirection!: 'above' | 'below';
  @IsInt() @Min(0) @Max(180) resetAngle!: number;
  @IsIn(['above', 'below']) resetDirection!: 'above' | 'below';
}

export class RepStateInstructionsDto {
  @IsString() rest!: string;
  @IsString() triggered!: string;
  @IsString() holding!: string;
  @IsString() returning!: string;
}

export class ExerciseMediaDto {
  @IsString() url!: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsIn(['image', 'video']) type?: 'image' | 'video';
}

export class CreateExerciseDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() instructions!: string;
  @IsIn(['front', 'side']) cameraOrientation!: 'front' | 'side';
  @IsString() cameraOrientationTip!: string;

  @IsInt() @Min(1) targetReps!: number;
  @IsInt() @Min(0) holdSeconds!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AngleCheckDto)
  angleChecks!: AngleCheckDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepTriggerDto)
  repTriggers!: RepTriggerDto[];

  @IsOptional()
  @IsEnum(['all', 'any'])
  repTriggerCombinator?: 'all' | 'any';

  @ValidateNested()
  @Type(() => RepStateInstructionsDto)
  repStateInstructions!: RepStateInstructionsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseMediaDto)
  media?: ExerciseMediaDto[];
}
