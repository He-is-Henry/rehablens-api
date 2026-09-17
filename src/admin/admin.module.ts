import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { AuditModule } from 'src/audit/audit.module';
import { SessionResultModule } from 'src/session-result/session-result.module';
import { RequestLogModule } from 'src/request-log/request-log.module';

@Module({
  imports: [
    UserModule,
    MailModule,
    AuditModule,
    SessionResultModule,
    RequestLogModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
