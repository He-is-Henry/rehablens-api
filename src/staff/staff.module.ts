import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PatientHospitalModule } from 'src/patient-hospital/patient-hospital.module';
import { UserModule } from 'src/user/user.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SessionResultModule } from 'src/session-result/session-result.module';

@Module({
  imports: [
    PatientHospitalModule,
    UserModule,
    AssignmentModule,
    SessionResultModule,
  ],
  providers: [StaffService],
  controllers: [StaffController],
})
export class StaffModule {}
