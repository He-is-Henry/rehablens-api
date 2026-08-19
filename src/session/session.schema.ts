import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  ipAddress!: string;

  @Prop({ required: true })
  deviceInfo!: string;

  @Prop({ required: true })
  location!: string;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);
