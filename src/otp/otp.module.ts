import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, OtpSchema } from './otp.schema';
import { SessionModule } from 'src/session/session.module';
import { OtpService } from './otp.service';

@Module({
  imports: [
    SessionModule,
    MongooseModule.forFeature([
      {
        name: OTP.name,
        schema: OtpSchema,
      },
    ]),
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
