import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  count!: number;
}

export type CounterDocument = Counter & Document;
export const CounterSchema = SchemaFactory.createForClass(Counter);
