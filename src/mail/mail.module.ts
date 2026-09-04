import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const OAuth2 = google.auth.OAuth2;

        const oauth2Client = new OAuth2(
          configService.get<string>('GOOGLE_CLIENT_ID'),
          configService.get<string>('GOOGLE_CLIENT_SECRET'),
          'https://google.com',
        );

        oauth2Client.setCredentials({
          refresh_token: configService.get<string>('GOOGLE_REFRESH_TOKEN'),
        });

        const accessToken = await new Promise<string>((resolve, reject) => {
          oauth2Client.getAccessToken(
            (err: Error | null, token?: string | null) => {
              if (err || !token) {
                reject(
                  new Error(
                    `Failed to generate Google OAuth2 token: ${err?.message}`,
                  ),
                );
              } else {
                resolve(token);
              }
            },
          );
        });

        const fromEmail = configService.get<string>('EMAIL_FROM');

        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            localAddress: '0.0.0.0',
            auth: {
              type: 'OAuth2',
              user: fromEmail,
              clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
              clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
              refreshToken: configService.get<string>('GOOGLE_REFRESH_TOKEN'),
              accessToken: accessToken,
            },
          },
          defaults: {
            from: `"Rehab Lens" <${fromEmail}>`,
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
