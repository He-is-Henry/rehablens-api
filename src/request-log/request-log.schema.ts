import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class RequestLog {
  @Prop({ required: true }) method!: string;
  @Prop({ required: true, index: true }) url!: string;
  @Prop({ required: true, index: true }) status!: number;
  @Prop({ required: true }) duration!: number;

  @Prop({ index: true }) userId?: string;
  @Prop({ index: true }) userRole?: string;

  @Prop() ipAddress?: string;
  @Prop() deviceInfo?: string;
  @Prop() location?: string;

  @Prop() errorMessage?: string;

  @Prop({
    required: true,
    default: Date.now,
    index: { expireAfterSeconds: 60 * 60 * 24 * 7 },
  })
  createdAt!: Date;
}

export type RequestLogDocument = RequestLog & Document;
export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
