import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Hospital {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  customId!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: false, unique: true })
  phone?: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  createdAt!: Date;
}

export type HospitalDocument = Hospital & Document;
export const HospitalSchema = SchemaFactory.createForClass(Hospital);
