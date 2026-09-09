import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { UserModule } from 'src/user/user.module';
import { PatientHospitalModule } from 'src/patient-hospital/patient-hospital.module';
import { HospitalModule } from 'src/hospital/hospital.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SessionResultModule } from 'src/session-result/session-result.module';

@Module({
  imports: [
    UserModule,
    PatientHospitalModule,
    HospitalModule,
    AssignmentModule,
    SessionResultModule,
  ],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
