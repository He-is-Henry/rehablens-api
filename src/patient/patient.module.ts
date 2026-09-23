import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { UserModule } from 'src/user/user.module';
import { PatientHospitalModule } from 'src/patient-hospital/patient-hospital.module';
import { HospitalModule } from 'src/hospital/hospital.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SessionResultModule } from 'src/session-result/session-result.module';
import { AuditModule } from 'src/audit/audit.module';
import { ScheduleModule } from 'src/schedule/schedule.module';

@Module({
  imports: [
    UserModule,
    PatientHospitalModule,
    HospitalModule,
    AssignmentModule,
    SessionResultModule,
    AuditModule,
    ScheduleModule,
  ],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
