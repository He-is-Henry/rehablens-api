import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Public } from 'src/common/decorators/public.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UserRole } from 'src/user/dto/create-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request } from 'express';

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
  @Post('hospitals/:id')
  addHospital(@Req() req: Request, @Param('id') hospitalId: string) {
    return this.patientService.sendHospitalRequest(req.user!.id, hospitalId);
  }
}
