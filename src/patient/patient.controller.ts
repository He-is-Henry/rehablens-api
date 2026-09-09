import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Public } from 'src/common/decorators/public.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UserRole } from 'src/user/dto/create-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request } from 'express';
import type { AssignmentStatus } from 'src/assignment/dto/create-assignment.dto';
import { CreateSessionResultDto } from 'src/session-result/dto/create-session-result.dto';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Public()
  @Post('signup')
  signup(@Body() createPatientDto: CreatePatientDto) {
    return this.patientService.create(createPatientDto);
  }

  @Roles(UserRole.PATIENT)
  @Get('hospitals')
  getHospitals(@Req() req: Request) {
    return this.patientService.getHospitals(req.user!.id);
  }

  @Roles(UserRole.PATIENT)
  @Get('hospitals/:linkId')
  getHospital(@Req() req: Request, @Param('linkId') linkId: string) {
    console.log('Here!');
    return this.patientService.getHospital(req.user!.id, linkId);
  }

  @Roles(UserRole.PATIENT)
  @Post('hospitals/:id')
  addHospital(@Req() req: Request, @Param('id') hospitalId: string) {
    return this.patientService.sendHospitalRequest(req.user!.id, hospitalId);
  }

  @Roles(UserRole.PATIENT)
  @Post('session-results')
  createSessionResult(
    @Req() req: Request,
    @Body() createSessionResultDto: CreateSessionResultDto,
  ) {
    return this.patientService.createSessionResult(
      createSessionResultDto,
      req.user!.id,
    );
  }

  @Roles(UserRole.PATIENT)
  @Get('session-results')
  getSessionResults(@Req() req: Request) {
    return this.patientService.getSessionResults(req.user!.id);
  }

  @Roles(UserRole.PATIENT)
  @Get('session-results/:assignmentId')
  getSessionResultsByAssignment(
    @Req() req: Request,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.patientService.getSessionResultsByAssignment(
      assignmentId,
      req.user!.id,
    );
  }

  @Roles(UserRole.PATIENT)
  @Get('assignments')
  getAssignments(
    @Req() req: Request,
    @Query('status') status?: AssignmentStatus,
    @Query('hospitalId') hospitalId?: string,
  ) {
    return this.patientService.getAssignments(req.user!.id, hospitalId, status);
  }

  @Roles(UserRole.PATIENT)
  @Get('assignments/:id')
  getAssignmentById(@Req() req: Request, @Param('id') id: string) {
    return this.patientService.getAssignmentById(id, req.user!.id);
  }
}
