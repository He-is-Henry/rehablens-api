import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OTP {
  @Prop({ required: true, unique: true, ref: 'User' })
  userId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  token!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true, default: 0 })
  attempts!: number;
}

export type OtpDocument = OTP & Document;
export const OtpSchema = SchemaFactory.createForClass(OTP);
