import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';
import { UserRole } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreatePatientHospitalDto } from 'src/patient-hospital/dto/create-patient-hospital.dto';
import { HospitalService } from 'src/hospital/hospital.service';
import mongoose from 'mongoose';

@Injectable()
export class PatientService {
  constructor(
    private readonly userService: UserService,
    private readonly patientHospitalService: PatientHospitalService,
    private readonly hospitalService: HospitalService,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    if (!mongoose.Types.ObjectId.isValid(createPatientDto.hospitalId))
      throw new NotFoundException('The hospital you provided does not exist');

    const hospitalExists = await this.hospitalService
      .findOne(createPatientDto.hospitalId)
      .select('name');

    if (!hospitalExists)
      throw new NotFoundException('The hospital you provided does not exist');

    const patient = await this.userService.create({
      ...createPatientDto,
      hospitalId: undefined,
      role: UserRole.PATIENT,
    });

    const createPatientHospitalDto: CreatePatientHospitalDto = {
      patientId: patient._id.toString(),
      hospitalId: createPatientDto.hospitalId,
    };

    await this.patientHospitalService.create(createPatientHospitalDto);
    return {
      message: 'Patient account created successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        customId: patient.customId,
        role: patient.role,
      },
    };
  }

  getHospitals(id: string) {
    const patientId = new mongoose.Types.ObjectId(id);
    return this.patientHospitalService.find({ patientId }, [
      'staffId',
      'hospitalId',
    ]);
  }

  async sendHospitalRequest(patientId: string, hospitalId: string) {
    const hospitalExists = await this.hospitalService.existsById(hospitalId);

    if (!hospitalExists)
      throw new NotFoundException('This Hospital does not exist');

    return this.patientHospitalService.create({
      hospitalId,
      patientId,
    });
  }
}
