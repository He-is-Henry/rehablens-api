import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import type { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { UpdateAssignmentDto } from 'src/assignment/dto/update-assignment.dto';
import { CreateSchedulesDto } from 'src/schedule/dto/create-schedule.dto';
import { UpdateScheduleDto } from 'src/schedule/dto/update-schedule.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles(UserRole.STAFF)
  @Get('patients')
  getPatients(@Req() req: Request) {
    return this.staffService.getPatients(req.user!.id, req.user!.hospitalId!);
  }

  @Roles(UserRole.STAFF)
  @Get('patients/:linkId')
  getStaffPatient(@Req() req: Request, @Param('linkId') linkId: string) {
    return this.staffService.getStaffPatient(linkId, req.user!.id);
  }
  @Roles(UserRole.STAFF)
  @Get('patients/:linkId/assignments')
  getAssignmentsForPatient(
    @Req() req: Request,
    @Param('linkId') linkId: string,
  ) {
    return this.staffService.getAssignmentsForPatient(linkId, req.user!.id);
  }

  @Roles(UserRole.STAFF)
  @Post('assignment')
  createAssignment(@Body() dto: CreateAssignmentDto, @Req() req: Request) {
    return this.staffService.createAssignment(
      dto,
      req.user!.hospitalId!,
      req.user!.id,
    );
  }

  @Roles(UserRole.STAFF)
  @Get('assignments/:id')
  getAssignment(@Param('id') id: string, @Req() req: Request) {
    return this.staffService.getAssignmentById(id, req.user!.id);
  }

  @Roles(UserRole.STAFF)
  @Patch('assignments/:id')
  updateAssignment(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @Req() req: Request,
  ) {
    return this.staffService.updateAssignment(
      id,
      req.user!.id,
      updateAssignmentDto,
    );
  }

  @Roles(UserRole.STAFF)
  @Delete('assignment/:id')
  deleteAssignment(@Param('id') id: string, @Req() req: Request) {
    return this.staffService.deleteAssignment(id, req.user!.id);
  }

  @Roles(UserRole.STAFF)
  @Get('assignments/:assignmentId/session-results')
  getSessionResults(
    @Req() req: Request,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.staffService.getSessionResults(assignmentId, req.user!.id);
  }
  @Roles(UserRole.STAFF)
  @Get('assignment/:assignmentId/schedules')
  getSchedules(
    @Param('assignmentId') assignmentId: string,
    @Req() req: Request,
  ) {
    return this.staffService.getSchedules(assignmentId, req.user!.id);
  }

  @Roles(UserRole.STAFF)
  @Post('assignment/:assignmentId/schedules')
  createSchedules(
    @Param('assignmentId') assignmentId: string,
    @Body() createSchedulesDto: CreateSchedulesDto,
    @Req() req: Request,
  ) {
    return this.staffService.createSchedules(
      assignmentId,
      req.user!.id,
      createSchedulesDto,
    );
  }

  @Roles(UserRole.STAFF)
  @Patch('schedules/:scheduleId')
  updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: Request,
  ) {
    console.log(
      `Updating ${scheduleId} with dto: ${JSON.stringify(updateScheduleDto)}`,
    );
    return this.staffService.updateSchedule(
      scheduleId,
      req.user!.id,
      updateScheduleDto,
    );
  }

  @Roles(UserRole.STAFF)
  @Delete('schedules/:scheduleId')
  deleteSchedule(@Param('scheduleId') scheduleId: string, @Req() req: Request) {
    return this.staffService.deleteSchedule(scheduleId, req.user!.id);
  }
}
