import { Module } from '@nestjs/common';
import { PatientHospitalService } from './patient-hospital.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PatientHospital,
  PatientHospitalSchema,
} from './patient-hospital.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PatientHospital.name,
        schema: PatientHospitalSchema,
      },
    ]),
    UserModule,
  ],
  providers: [PatientHospitalService],
  exports: [PatientHospitalService],
})
export class PatientHospitalModule {}
