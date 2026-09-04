import { Test, TestingModule } from '@nestjs/testing';
import { PatientHospitalService } from './patient-hospital.service';

describe('PatientHospitalService', () => {
  let service: PatientHospitalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientHospitalService],
    }).compile();

    service = module.get<PatientHospitalService>(PatientHospitalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
