import { Module } from '@nestjs/common';
import { SessionModule } from 'src/session/session.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [SessionModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
