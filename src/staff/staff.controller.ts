import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { StaffService } from './staff.service';
import type { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';

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
  @Get('assignments/:assignmentId/session-results')
  getSessionResults(
    @Req() req: Request,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.staffService.getSessionResults(assignmentId, req.user!.id);
  }
}
