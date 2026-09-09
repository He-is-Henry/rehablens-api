import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { type LandmarkKey, LANDMARK_KEYS } from 'src/common/types/landmark';

@Schema({ _id: false })
export class AngleCheck {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  a!: LandmarkKey;

  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  b!: LandmarkKey;

  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  c!: LandmarkKey;
}

export const AngleCheckSchema = SchemaFactory.createForClass(AngleCheck);

@Schema({ _id: false })
export class RepTrigger {
  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  a!: LandmarkKey;

  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  b!: LandmarkKey;

  @Prop({ required: true, type: String, enum: LANDMARK_KEYS })
  c!: LandmarkKey;

  @Prop({ required: true, min: 0, max: 180 })
  targetAngle!: number;

  @Prop({ required: true, enum: ['above', 'below'] })
  targetDirection!: 'above' | 'below';

  @Prop({ required: true, min: 0, max: 180 })
  resetAngle!: number;

  @Prop({ required: true, enum: ['above', 'below'] })
  resetDirection!: 'above' | 'below';
}

export const RepTriggerSchema = SchemaFactory.createForClass(RepTrigger);

@Schema({ _id: false })
export class RepStateInstructions {
  @Prop({ required: true })
  rest!: string;

  @Prop({ required: true })
  triggered!: string;

  @Prop({ required: true })
  holding!: string;

  @Prop({ required: true })
  returning!: string;
}

export const RepStateInstructionsSchema =
  SchemaFactory.createForClass(RepStateInstructions);

@Schema({ timestamps: true })
export class Exercise {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  instructions!: string;

  @Prop({ required: true, enum: ['front', 'side'] })
  cameraOrientation!: 'front' | 'side';

  @Prop({ required: true })
  cameraOrientationTip!: string;

  @Prop({ required: true, min: 1 })
  targetReps!: number;

  @Prop({ required: true, min: 0 })
  holdSeconds!: number;

  @Prop({ type: [AngleCheckSchema], required: true })
  angleChecks!: AngleCheck[];

  @Prop({ type: [RepTriggerSchema], required: true })
  repTriggers!: RepTrigger[];

  @Prop({ enum: ['all', 'any'], default: 'all' })
  repTriggerCombinator!: 'all' | 'any';

  @Prop({ type: RepStateInstructionsSchema, required: true })
  repStateInstructions!: RepStateInstructions;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export type ExerciseDocument = Exercise & Document;
export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
