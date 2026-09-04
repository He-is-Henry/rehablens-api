import { IsMongoId } from 'class-validator';

export class CreatePatientHospitalDto {
  @IsMongoId()
  patientId!: string;

  @IsMongoId()
  hospitalId!: string;

  @IsMongoId()
  staffId?: string;

  verified?: boolean;
}
