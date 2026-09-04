import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gmail_v1 } from 'googleapis';

@Injectable()
export class MailService {
  constructor(
    @Inject('GMAIL_CLIENT') private readonly gmail: gmail_v1.Gmail,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends an email via the Google Gmail REST API over HTTPS
   * @param to The recipient's email address
   * @param subject The email subject line
   * @param body Text or HTML body content
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ success: boolean; messageId: string }> {
    try {
      const fromEmail = this.configService.get<string>('EMAIL_FROM');

      // Construct clean standard MIME headers + message body string
      const messageParts = [
        `From: "Rehab Lens" <${fromEmail}>`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body,
      ];
      const message = messageParts.join('\n');

      // Convert to Base64URL safe format required by Google API
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Execute dispatch using HTTPS instead of raw TCP SMTP sockets
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        success: true,
        messageId: response.data.id || 'unknown-id',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('HTTPS Email dispatch failed:', error);
      throw new InternalServerErrorException(
        `Failed to dispatch email: ${errorMessage}`,
      );
    }
  }
}
