import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { AssignmentStatus } from './dto/create-assignment.dto';

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Hospital',
    required: true,
  })
  hospitalId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Exercise',
    required: true,
  })
  exerciseId!: Types.ObjectId;

  @Prop({ min: 1 })
  customReps?: number;

  @Prop({ min: 0 })
  customHoldSeconds?: number;

  @Prop()
  notes?: string;

  @Prop({
    required: true,
    enum: ['active', 'completed', 'paused', 'archived'],
    default: 'active',
  })
  status!: AssignmentStatus;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export type AssignmentDocument = Assignment & Document;
export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
