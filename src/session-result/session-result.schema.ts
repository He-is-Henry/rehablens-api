import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SessionResult {
  @Prop({
    type: Types.ObjectId,
    ref: 'Assignment',
    required: true,
  })
  assignmentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  repsCompleted!: number;

  @Prop({ required: true, min: 1 })
  targetReps!: number;

  @Prop({ required: true, min: 0 })
  durationSeconds!: number;

  @Prop({ type: Types.ObjectId, ref: 'Schedule', required: true })
  scheduleId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['in_progress', 'completed', 'abandoned'],
  })
  status!: 'in_progress' | 'completed' | 'abandoned';

  @Prop({ default: 0 })
  pointsAwarded!: number;

  @Prop({ type: Date, default: Date.now })
  completedAt?: Date;
}

export type SessionResultDocument = SessionResult & Document;
export const SessionResultSchema = SchemaFactory.createForClass(SessionResult);

SessionResultSchema.index(
  { scheduleId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } },
);
