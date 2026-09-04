import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UserRole } from './dto/create-user.dto';

@Schema()
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, unique: true })
  customId!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  role!: UserRole;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' })
  hospitalId?: mongoose.Types.ObjectId;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, default: false })
  isPioneer!: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
