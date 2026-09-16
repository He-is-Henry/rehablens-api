import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin-dto';
import { UserService } from 'src/user/user.service';
import * as crypto from 'crypto';
import { UserRole } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/user.schema';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto) {
    const password = crypto.randomBytes(8).toString('hex');

    const user = await this.userService.create({
      ...createAdminDto,
      password,
      role: UserRole.ADMIN,
    });

    await this.mailService.sendEmail(
      user.email,
      'Welcome to Rehablens admin dashboard',
      this.buildWelcomeMail({ ...user.toObject(), password }),
    );
  }

  buildWelcomeMail(
    user: User,
    loginUrl = 'https://rehablens.onrender.com/auth/login-redirect',
  ) {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid #DDE5E4; overflow: hidden;">

            <!-- Header -->
            <tr>
              <td style="background-color: #1E3F3A; padding: 32px 40px;">
                <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">RehabLens</p>
                <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.55);">Admin Portal Access</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #23302E;">Welcome to the Admin Portal!</p>
                <p style="margin: 0 0 24px; font-size: 14px; color: #5C6B68; line-height: 1.6;">
                  Hello <strong>${user.name}</strong>,<br/>
                  An administrator account has been created for you on the RehabLens platform.
                </p>

                <!-- Credentials Container -->
                <div style="background-color: #FAFAF8; border: 1px dashed #DDE5E4; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                  <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #1E3F3A; text-transform: uppercase; letter-spacing: 0.5px;">Account Email</p>
                  <p style="margin: 0 0 16px; font-size: 14px; color: #23302E; font-weight: 600;">${user.email}</p>

                  <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #1E3F3A; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</p>
                  
                  <!-- Isolated Copyable Box -->
                  <div style="background: #EBF1F0; border: 1px solid #D1E0DD; border-radius: 6px; padding: 12px; margin-bottom: 16px; text-align: center;">
                    <span style="font-size: 18px; font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #1E3F3A; letter-spacing: 1px; user-select: all; -webkit-user-select: all;">${user.password}</span>
                  </div>

                  <p style="margin: 0; font-size: 12px; color: #788885; line-height: 1.5; font-style: italic;">
                    Note: For security reasons, you will be required to change this password immediately upon your first login.
                  </p>
                </div>

                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="background-color: #2F6F64; border-radius: 8px;">
                      <a href="${loginUrl}"
                         style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.2px;">
                        Open Admin Portal
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 40px 32px; border-top: 1px solid #DDE5E4;">
                <p style="margin: 0; font-size: 12px; color: #5C6B68; line-height: 1.6;">
                  This is an automated administrative invitation. If you were not expecting this, please contact system support immediately.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
  }
}
