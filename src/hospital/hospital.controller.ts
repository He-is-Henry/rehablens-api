import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';
import type { Request } from 'express';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateStaffDto } from 'src/staff/dto/create-staff.dto';
import mongoose from 'mongoose';
import {
  AssignStaffDto,
  UpdateStaffDto,
  LinkPatientDto,
} from 'src/staff/dto/update-staff.dto';
import { UserService } from 'src/user/user.service';
import { UpdateAssignmentDto } from 'src/assignment/dto/update-assignment.dto';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';

@Controller('hospital')
export class HospitalController {
  constructor(
    private readonly hospitalService: HospitalService,
    private readonly userService: UserService,
  ) {}

  //register
  @Public()
  @Post('register')
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalService.create(createHospitalDto);
  }

  // find
  @Public()
  @Get('search')
  search(@Query('q') query: string) {
    return this.hospitalService.search(query);
  }

  // profile
  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('profile')
  getHospital(@Req() req: Request) {
    return this.hospitalService.findOne(req.user?.hospitalId);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Patch('profile')
  update(@Req() req: Request, @Body() updateHospitalDto: UpdateHospitalDto) {
    return this.hospitalService.update(req.user?.hospitalId, updateHospitalDto);
  }

  // staff
  @Roles(UserRole.HOSPITAL_ADMIN)
  @Post('staff')
  createHospitalStaff(
    @Body() createStaffDto: CreateStaffDto,
    @Req() req: Request,
  ) {
    return this.hospitalService.createStaff(
      req.user?.hospitalId,
      createStaffDto,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('staff')
  getSAlltaff(@Req() req: Request) {
    return this.hospitalService.getAllStaff(req.user?.hospitalId);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('staff/:id')
  getStaff(@Req() req: Request, @Param('id') id: string) {
    return this.hospitalService.getstaff({
      id,
      hospitalId: req.user?.hospitalId,
    });
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Patch('staff/:id')
  updateStaff(
    @Req() req: Request,
    @Body() updateStaffDto: UpdateStaffDto,
    @Param('id') id: string,
  ) {
    const filter = {
      _id: new mongoose.Types.ObjectId(id),
      hospitalId: new mongoose.Types.ObjectId(req.user!.hospitalId),
      isPioneer: false,
    };
    return this.hospitalService.updateStaff(
      filter,
      updateStaffDto,
      req.user!.id,
    );
  }

  // search staff
  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('staff/search')
  searchStaff(@Query('q') query: string, @Req() req: Request) {
    return this.userService.search(query, UserRole.STAFF, req.user!.hospitalId);
  }

  // patients
  @Roles(UserRole.HOSPITAL_ADMIN)
  @Post('patient/:id')
  linkPatient(
    @Param('id') patientId: string,
    @Req() req: Request,
    @Body() linkPatientDto: LinkPatientDto,
  ) {
    return this.hospitalService.linkPatient(
      patientId,
      req.user!.hospitalId!,
      linkPatientDto.staffId,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('patient')
  getLinkedPatients(
    @Query('filter') filter: string,
    @Query('staffId') staffId: string,
    @Req() req: Request,
  ) {
    return this.hospitalService.getLinkedPatients(
      req.user!.hospitalId!,
      filter,
      staffId,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('patient/:linkId')
  getLinkedPatientById(@Query('linkId') linkId: string, @Req() req: Request) {
    return this.hospitalService.getLinkedPatient(linkId, req.user!.hospitalId!);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Patch('patient/:id/verify')
  togglePatientVerification(@Param('id') id: string, @Req() req: Request) {
    return this.hospitalService.toggleVerification(id, req.user!.hospitalId!);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Patch('patient/:linkId/assign-staff')
  assignStaff(
    @Param('linkId') linkId: string,
    @Body() assignStaffDto: AssignStaffDto,
    @Req() req: Request,
  ) {
    return this.hospitalService.assignStaff(
      linkId,
      assignStaffDto.staffId,
      req.user!.hospitalId!,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('patients/search')
  searcPatients(@Query('q') query: string) {
    return this.hospitalService.searchPatients(query);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Post('assignment')
  createAssignment(@Body() dto: CreateAssignmentDto, @Req() req: Request) {
    return this.hospitalService.createAssignment(
      dto,
      req.user!.hospitalId!,
      req.user!.id,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('assignment')
  getAssignments(@Query('patientId') patientId: string, @Req() req: Request) {
    return this.hospitalService.getAssignments(
      req.user!.hospitalId!,
      patientId,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('assignment/:id')
  getAssignmentById(@Param('id') id: string, @Req() req: Request) {
    return this.hospitalService.getAssignmentById(id, req.user!.hospitalId!);
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Patch('assignment/:id')
  updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @Req() req: Request,
  ) {
    return this.hospitalService.updateAssignment(
      id,
      req.user!.hospitalId!,
      dto,
    );
  }

  @Roles(UserRole.HOSPITAL_ADMIN)
  @Get('assignment/:assignmentId/session-results')
  getSessionResults(
    @Param('assignmentId') assignmentId: string,
    @Req() req: Request,
  ) {
    return this.hospitalService.getSessionResults(
      assignmentId,
      req.user!.hospitalId!,
    );
  }
}
