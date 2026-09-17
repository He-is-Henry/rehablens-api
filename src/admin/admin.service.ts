import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin-dto';
import { UserService } from 'src/user/user.service';
import * as crypto from 'crypto';
import { UserRole } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/user.schema';
import { MailService } from 'src/mail/mail.service';
import { AuditService } from 'src/audit/audit.service';
import { SessionResultService } from 'src/session-result/session-result.service';
import { RequestLogService } from 'src/request-log/request-log.service';
import { QueryFilter } from 'mongoose';
import { RequestLog } from 'src/request-log/request-log.schema';
import { RequestLogQueryDto } from 'src/request-log/dto/query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly sessionResultService: SessionResultService,
    private readonly requestLogService: RequestLogService,
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
      this.buildWelcomeMail(user, password),
    );
  }

  buildWelcomeMail(
    user: User,
    password: string,
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
                    <span style="font-size: 18px; font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #1E3F3A; letter-spacing: 1px; user-select: all; -webkit-user-select: all;">${password}</span>
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

  findAll() {
    return this.userService.findAll({ role: UserRole.ADMIN });
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      hospitals,
      staff,
      patients,
      sessionsTotal,
      registeredToday,
      sessionsToday,
    ] = await Promise.all([
      this.userService.count({ role: UserRole.HOSPITAL_ADMIN }),
      this.userService.count({ role: UserRole.STAFF }),
      this.userService.count({ role: UserRole.PATIENT }),
      this.sessionResultService.count({}),
      this.userService.count({ createdAt: { $gte: startOfToday } }),
      this.sessionResultService.count({ completedAt: { $gte: startOfToday } }),
    ]);

    return {
      totalHospitals: hospitals,
      totalStaff: staff,
      totalPatients: patients,
      totalSessions: sessionsTotal,
      registeredToday,
      sessionsToday,
    };
  }

  async getTimeseries(
    metric: 'registrations' | 'sessions' | 'errors',
    days: number,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    if (metric === 'registrations') {
      return this.userService.countByDay(since);
    }
    if (metric === 'sessions') {
      return this.sessionResultService.countByDay(since);
    }
    return this.requestLogService.countErrorsByDay(since);
  }

  async getRequestLogs(
    filter: Omit<RequestLogQueryDto, 'limit' | 'cursor'>,
    limit: number,
    cursor?: string,
  ) {
    const query: QueryFilter<RequestLog> & Record<string, any> = {};
    if (filter.status) query.status = filter.status;
    if (filter.url) query.url = filter.url;
    if (filter.userId) query.userId = filter.userId;
    if (filter.from || filter.to) {
      query.createdAt = {
        ...(filter.from && { $gte: new Date(filter.from) }),
        ...(filter.to && { $lte: new Date(filter.to) }),
      };
    }
    return this.requestLogService.find(query, limit, cursor);
  }

  async getRequestStats() {
    const [stats] = await this.requestLogService.getStats();
    const slowest = await this.requestLogService.getSlowestEndpoints();
    const errorProne = await this.requestLogService.getErrorRateByEndpoint();

    return {
      totalRequests: stats?.totalRequests ?? 0,
      avgDuration: Math.round(stats?.avgDuration ?? 0),
      errorCount: stats?.errorCount ?? 0,
      slowestEndpoints: slowest,
      errorProneEndpoints: errorProne,
    };
  }

  async getAuditLogs(
    filter: {
      action?: string;
      userId?: string;
      from?: string;
      to?: string;
    },
    limit: number,
    cursor?: string,
  ) {
    const query: Record<string, any> = {};
    if (filter.action) query.action = filter.action;
    if (filter.userId) {
      query.$or = [
        { 'actor.userId': filter.userId },
        { 'affected.userId': filter.userId },
      ];
    }
    if (filter.from || filter.to) {
      query.createdAt = {
        ...(filter.from && { $gte: new Date(filter.from) }),
        ...(filter.to && { $lte: new Date(filter.to) }),
      };
    }
    return this.auditService.find(query, limit, cursor);
  }

  async searchUsers(query: string) {
    return this.userService.search(query);
  }

  async sendTestMail(to: string, subject: string, body: string) {
    return this.mailService.sendEmail(to, subject, body);
  }
}
