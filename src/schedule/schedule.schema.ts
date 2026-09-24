import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId!: Types.ObjectId;

  @Prop({ required: true })
  scheduledDate!: string; // "YYYY-MM-DD", timezone-agnostic

  @Prop({ required: true, min: 1, default: 1 })
  minSessions!: number;

  @Prop({ type: Number, default: null })
  maxSessions!: number | null;

  @Prop({ default: 0 })
  completedCount!: number;
}

export type ScheduleDocument = Schedule & Document;
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

ScheduleSchema.index({ assignmentId: 1, scheduledDate: 1 }, { unique: true });
