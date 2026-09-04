import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PatientHospital {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  patientId!: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Hospital' })
  hospitalId!: mongoose.Types.ObjectId;

  @Prop({ required: false, type: mongoose.Types.ObjectId, ref: 'User' })
  staffId?: mongoose.Types.ObjectId;

  @Prop({ required: true, default: false })
  verified!: boolean;
}

export type PatientHospitalDocument = PatientHospital & Document;
export const PatientHospitalSchema =
  SchemaFactory.createForClass(PatientHospital);

PatientHospitalSchema.index(
  {
    hospitalId: 1,
    patientId: 1,
  },
  {
    unique: true,
  },
);
