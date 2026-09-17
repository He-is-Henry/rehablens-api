import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SessionModule } from 'src/session/session.module';
import { OtpModule } from 'src/otp/otp.module';
import { MailModule } from 'src/mail/mail.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [UserModule, SessionModule, OtpModule, MailModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
