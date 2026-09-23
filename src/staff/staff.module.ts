import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PatientHospitalModule } from 'src/patient-hospital/patient-hospital.module';
import { UserModule } from 'src/user/user.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SessionResultModule } from 'src/session-result/session-result.module';
import { AuditModule } from 'src/audit/audit.module';
import { ScheduleModule } from 'src/schedule/schedule.module';

@Module({
  imports: [
    AuditModule,
    PatientHospitalModule,
    UserModule,
    AssignmentModule,
    SessionResultModule,
    ScheduleModule,
  ],
  providers: [StaffService],
  controllers: [StaffController],
})
export class StaffModule {}
