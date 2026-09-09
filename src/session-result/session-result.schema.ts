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

  @Prop({
    required: true,
    enum: ['completed', 'abandoned'],
  })
  status!: 'completed' | 'abandoned';

  @Prop({ required: true, type: Date })
  completedAt!: Date;
}

export type SessionResultDocument = SessionResult & Document;
export const SessionResultSchema = SchemaFactory.createForClass(SessionResult);
