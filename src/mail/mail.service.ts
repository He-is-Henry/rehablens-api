import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

// Define a localized strict interface to bypass the third-party 'any' types
interface SafeMailResponse {
  messageId?: string;
}

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a simple email using the pre-configured Google OAuth2 transport
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
      // Treat the third-party response as unknown to avoid unsafe any assignment
      const response: unknown = await this.mailerService.sendMail({
        to,
        subject,
        text: body.replace(/<[^>]*>/g, ''),
        html: body,
      });

      // Map it cleanly by checking if the structure exists safely
      const info = response as SafeMailResponse;

      return {
        success: true,
        messageId: info?.messageId || 'unknown-id',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Email dispatch failed:', error);
      throw new InternalServerErrorException(
        `Failed to dispatch email: ${errorMessage}`,
      );
    }
  }
}
