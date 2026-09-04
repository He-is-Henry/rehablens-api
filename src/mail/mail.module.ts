import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    MailService,
    {
      provide: 'GMAIL_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const oauth2Client = new google.auth.OAuth2(
          configService.get<string>('GOOGLE_CLIENT_ID'),
          configService.get<string>('GOOGLE_CLIENT_SECRET'),
          'https://google.com',
        );

        oauth2Client.setCredentials({
          refresh_token: configService.get<string>('GOOGLE_REFRESH_TOKEN'),
        });

        return google.gmail({ version: 'v1', auth: oauth2Client });
      },
    },
  ],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
