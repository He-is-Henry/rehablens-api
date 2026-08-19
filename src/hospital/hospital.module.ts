import { Module } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './hospital.schema';
import { CounterModule } from 'src/counter/counter.module';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
    CounterModule,
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
})
export class HospitalModule {}
