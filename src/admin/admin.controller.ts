import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin-dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';
import { RequestLogQueryDto } from 'src/request-log/dto/query.dto';
import { AuditLogQueryDto } from 'src/audit/dto/query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  getAdmins() {
    return this.adminService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Roles(UserRole.ADMIN)
  @Get('stats/timeseries')
  getTimeseries(
    @Query('metric') metric: 'registrations' | 'sessions' | 'errors',
    @Query('days') days: string,
  ) {
    return this.adminService.getTimeseries(metric, days ? Number(days) : 30);
  }

  @Roles(UserRole.ADMIN)
  @Get('logs/requests')
  getRequestLogs(@Query() query: RequestLogQueryDto) {
    const { limit, cursor, ...filter } = query;
    return this.adminService.getRequestLogs(
      filter,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('logs/audit')
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    const { limit, cursor, ...filter } = query;
    return this.adminService.getAuditLogs(
      filter,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Roles(UserRole.ADMIN)
  @Get('users/search')
  searchUsers(@Query('q') q: string) {
    return this.adminService.searchUsers(q);
  }

  @Roles(UserRole.ADMIN)
  @Post('test-mail')
  sendTestMail(@Body() body: { to: string; subject: string; body: string }) {
    return this.adminService.sendTestMail(body.to, body.subject, body.body);
  }

  @Roles(UserRole.ADMIN)
  @Get('stats/requests')
  getRequestStats() {
    return this.adminService.getRequestStats();
  }
}
