import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientHospitalDto } from './create-patient-hospital.dto';

export class UpdatePatientHospitalDto extends PartialType(CreatePatientHospitalDto) {}
