import { Module } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './hospital.schema';
import { CounterModule } from 'src/counter/counter.module';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/user.schema';
import { PatientHospitalModule } from 'src/patient-hospital/patient-hospital.module';
import { MailModule } from 'src/mail/mail.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SessionResultModule } from 'src/session-result/session-result.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
    CounterModule,
    PatientHospitalModule,
    MailModule,
    AssignmentModule,
    SessionResultModule,
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}
