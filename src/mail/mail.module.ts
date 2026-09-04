import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Allows access to environment variables
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const OAuth2 = google.auth.OAuth2;

        // Initialize the Google OAuth2 client
        const oauth2Client = new OAuth2(
          configService.get<string>('GOOGLE_CLIENT_ID'),
          configService.get<string>('GOOGLE_CLIENT_SECRET'),
          'https://google.com', // Redirect URI used to generate refresh token
        );

        // Supply refresh token to get a live access token
        oauth2Client.setCredentials({
          refresh_token: configService.get<string>('GOOGLE_REFRESH_TOKEN'),
        });

        // Request an access token dynamically from Google's authorization servers
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

        // Configure Nodemailer transport settings
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
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
            from: `"Rehab Lens" <${fromEmail}>`, // Default display sender configuration
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
