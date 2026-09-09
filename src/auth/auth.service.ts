import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import {
  LoginDto,
  Payload,
  PayloadUser,
  ResetPayload,
  ResetPasswordDto,
} from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ISchemaClientData } from './decorators/client-info.decorator';
import { SessionService } from 'src/session/session.service';
import { EditProfileDto } from './dto/update-auth.dto';
import { OtpService } from 'src/otp/otp.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserDocument } from 'src/user/user.schema';
import { OtpDocument } from 'src/otp/otp.schema';
import mongoose from 'mongoose';
import { HospitalDocument } from 'src/hospital/hospital.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto, clientData: ISchemaClientData) {
    const authResult = await this.userService.authenticate(loginDto);

    if (authResult.error || !authResult.passwordCorect) {
      throw new UnauthorizedException(authResult.message);
    }

    const user = authResult.user;

    if (!user.isActive)
      throw new UnauthorizedException(
        'This account is inactive, contact your administrator',
      );

    const session = await this.sessionService.init({
      ...clientData,
      userId: user._id.toString(),
      refreshToken: '',
    });

    const { accessToken, refreshToken } = this.signTokens(
      user,
      session._id.toString(),
    );

    session.refreshToken = this.sessionService.hashToken(refreshToken);

    await session.save();

    const sessions = await this.sessionService.getUserSessions(
      user._id.toString(),
    );

    return {
      accessToken,
      refreshToken,
      user,
      session,
      sessionCount: sessions.length,
    };
  }

  async changeInitialPassword(id: string, newPassword: string) {
    const filter: Partial<UserDocument> = {
      _id: new mongoose.Types.ObjectId(id),
      mustChangePassword: true,
    };
    const update: Partial<UserDocument> = {
      password: await bcrypt.hash(newPassword, 10),
      mustChangePassword: false,
    };

    const user = await this.userService.findOneAndUpdate(filter, update);

    if (!user) throw new NotFoundException('User profile not found');

    return {
      message: 'Password reset successfully',
      user,
    };
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findById(id).select('+password');

    if (!user) throw new NotFoundException('User profile not found');

    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordCorrect)
      throw new ForbiddenException('Incorrect current password, try again');

    const filter = {
      _id: new mongoose.Types.ObjectId(id),
    };
    const update = {
      password: await bcrypt.hash(newPassword, 10),
    };

    await this.userService.findOneAndUpdate(filter, update);

    return {
      message: 'Password reset successfully',
    };
  }

  signTokens(user: PayloadUser, sessionId: string) {
    console.log(user);

    const payload: Payload = {
      id: user._id.toString(),
      customId: user.customId,
      role: user.role,
      hospitalId: user?.hospitalId?._id?.toString(),
      sessionId,
      mustChangePassword: user.mustChangePassword,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '10d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getProfile(id: string, sessionId: string) {
    const user = await this.userService.findById(id).populate('hospitalId');
    const sessionDocs = await this.sessionService.getUserSessions(id);

    const sessions = sessionDocs.map((s) => {
      return s._id.toString() === sessionId
        ? { ...s.toObject(), currentDevice: true }
        : s;
    });
    return {
      user,
      sessionCount: sessions.length,
      sessions,
    };
  }

  updateProfile(id: string, editProfileDto: EditProfileDto) {
    return this.userService.update(id, editProfileDto);
  }

  async verifyRefreshToken(token: string) {
    const decoded: Payload = await this.jwtService.verify(token, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    return decoded;
  }

  async refresh(token: string) {
    const decoded = await this.verifyRefreshToken(token);

    if (!decoded) throw new UnauthorizedException('Invalid token');

    const userId = decoded.id;

    const user = await this.userService
      .findById(userId)
      .populate<{ hospitalId: HospitalDocument }>('hospitalId');

    if (!user) throw new UnauthorizedException("User doens't exist");
    if (!user.isActive)
      throw new UnauthorizedException(
        'This account is inactive, contact your administrator',
      );
    const session = await this.sessionService.getSession(userId, token);

    if (!session) throw new UnauthorizedException('Invalid session');

    const { accessToken, refreshToken } = this.signTokens(
      user,
      session._id.toString(),
    );

    const updatedSession = await this.sessionService.updateSession(
      session._id,
      { refreshToken },
    );

    return {
      message: 'Token refresh successful',
      accessToken,
      refreshToken,
      session: updatedSession,
    };
  }

  async logout(token?: string) {
    if (!token) return;

    const decoded = await this.verifyRefreshToken(token);

    const session = await this.sessionService.getSession(decoded.id, token);

    if (!session) return;

    await session.deleteOne();
    return { message: 'Logout successful' };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionService.findById(sessionId);

    if (!session) throw new NotFoundException("Session doesn't exist");

    if (session.userId !== userId) throw new ForbiddenException();

    return session.deleteOne();
  }

  async revokeAllSessions(userId: string, sessionId: string) {
    return await this.sessionService.deleteSessionExcept(userId, sessionId);
  }

  async forgotPassword(email: string) {
    const userExists = await this.userService.exists({ email });

    if (!userExists)
      return {
        message: 'If your account exists, an email has been sent',
      };
    const userId = userExists._id.toString();
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');

    const payload: ResetPayload = {
      userId,
      code,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('RESET_PASSWORD_SECRET'),
      expiresIn: '15m',
    });
    const hashedCode = await bcrypt.hash(code, 10);
    await this.otpService.upsert(userId, token, hashedCode);
    const subject = 'Reset your RehabLens password';

    const body = `
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
                <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.55);">Camera-powered rehab, anywhere</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #23302E;">Reset your password</p>
                <p style="margin: 0 0 28px; font-size: 14px; color: #5C6B68; line-height: 1.6;">
                  We received a request to reset your RehabLens password. Tap the button below to choose a new one. This link expires in <strong>15 minutes</strong>.
                </p>

                <!-- Button -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                  <tr>
                    <td style="background-color: #2F6F64; border-radius: 8px;">
                      <a href="https://rehablens-api.onrender.com/auth/reset-password-redirect?token=${token}"
                         style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.2px;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="border-top: 1px solid #DDE5E4;"></td>
                  </tr>
                </table>

                <!-- Code fallback -->
                <p style="margin: 0 0 12px; font-size: 13px; color: #5C6B68;">
                  Can't open the link? Enter this code manually in the app:
                </p>
                <div style="background-color: #FAFAF8; border: 1px dashed #DDE5E4; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1E3F3A; letter-spacing: 8px;">${code}</p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 40px 32px; border-top: 1px solid #DDE5E4;">
                <p style="margin: 0; font-size: 12px; color: #5C6B68; line-height: 1.6;">
                  If you didn't request a password reset, you can safely ignore this email. Your password won't change.
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
    await this.mailService.sendEmail(email, subject, body);

    return {
      message: 'If your account exists, an email has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, email, newPassword, manualCode } = resetPasswordDto;

    if (!token && !manualCode)
      throw new BadRequestException('A code or token is required');

    let result: { user: UserDocument; canVerify: boolean; match: OtpDocument };

    if (token) {
      result = await this.verifyResetToken(token);
    } else if (manualCode) {
      result = await this.verifyResetCode(manualCode, email);
    } else {
      throw new BadRequestException();
    }

    if (result.canVerify)
      await this.handlePasswordReset(result.user, newPassword, result.match);

    return { message: 'Password reset successful' };
  }

  async verifyResetToken(token: string) {
    const match = await this.otpService.findByToken(token);

    if (!match) throw new UnauthorizedException('Invalid or expired token');

    if (match.attempts >= 3)
      throw new UnauthorizedException('You have used this link too many times');

    try {
      const decoded: ResetPayload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('RESET_PASSWORD_SECRET'),
      });

      const user = await this.userService
        .findById(decoded.userId)
        .select('+password');
      if (!user) throw new NotFoundException('User does not exist');

      return { canVerify: true, user, match };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      match.attempts++;
      await match.save();
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyResetCode(manualCode: string, email: string) {
    const user = await this.userService.findByEmail(email).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const match = await this.otpService.findByUserId(user._id.toString());

    if (!match) throw new UnauthorizedException('Invalid or expired token');

    if (match.attempts >= 3)
      throw new UnauthorizedException('You have used this link too many times');

    const codeIsCorrect = await bcrypt.compare(manualCode, match.code);

    if (!codeIsCorrect) {
      match.attempts++;
      await match.save();
      throw new UnauthorizedException('Invalid code');
    }

    return { canVerify: true, user, match };
  }

  async handlePasswordReset(
    user: UserDocument,
    newPassword: string,
    match: OtpDocument,
  ) {
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await match.deleteOne();
  }
}
