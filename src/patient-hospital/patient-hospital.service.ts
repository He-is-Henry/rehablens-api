import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PatientHospital,
  PatientHospitalDocument,
} from './patient-hospital.schema';
import { Model } from 'mongoose';
import { CreatePatientHospitalDto } from './dto/create-patient-hospital.dto';
import { UserService } from 'src/user/user.service';
import mongoose from 'mongoose';

@Injectable()
export class PatientHospitalService {
  constructor(
    @InjectModel(PatientHospital.name)
    private readonly patientHospitalModel: Model<PatientHospital>,
    private readonly userService: UserService,
  ) {}

  async create(createPatientHospitalDto: CreatePatientHospitalDto) {
    const patientId = new mongoose.Types.ObjectId(
      createPatientHospitalDto.patientId,
    );
    const hospitalId = new mongoose.Types.ObjectId(
      createPatientHospitalDto.hospitalId,
    );

    const linkAlreadyExists = await this.exists({
      patientId,
      hospitalId,
    });

    if (linkAlreadyExists)
      throw new ConflictException(
        'This patient is already in this organization',
      );
    const userExists = await this.userService.existsById(
      createPatientHospitalDto.patientId,
    );

    if (!userExists) throw new NotFoundException('Invalid patient');

    return this.patientHospitalModel.create({
      ...createPatientHospitalDto,
      patientId,
      hospitalId,
    });
  }

  find(
    filter: Partial<PatientHospitalDocument>,
    populate: ('patientId' | 'staffId' | 'hospitalId')[],
  ) {
    type PopulatePath = 'patientId' | 'staffId' | 'hospitalId';

    const POPULATE_FIELDS: Record<PopulatePath, string> = {
      patientId: 'name email customId',
      staffId: 'name email customId',
      hospitalId: 'name address email customId',
    };

    return this.patientHospitalModel.find(filter).populate(
      populate.map((p) => ({
        path: p,
        select: POPULATE_FIELDS[p],
      })),
    );
  }

  findOne(
    filter: Partial<PatientHospitalDocument>,
    populate: ('patientId' | 'staffId' | 'hospitalId')[],
  ) {
    type PopulatePath = 'patientId' | 'staffId' | 'hospitalId';
    const POPULATE_FIELDS: Record<PopulatePath, string> = {
      patientId: 'name email customId',
      staffId: 'name email customId',
      hospitalId: 'name address email customId',
    };
    return this.patientHospitalModel.findOne(filter).populate(
      populate.map((p) => ({
        path: p,
        select: POPULATE_FIELDS[p],
      })),
    );
  }

  findById(id: string) {
    return this.patientHospitalModel.findById(id);
  }

  exists(filter: Partial<PatientHospitalDocument>) {
    return this.patientHospitalModel.exists(filter);
  }

  async toggleVerification(id: string, hospitalId: string) {
    const current = await this.patientHospitalModel.findById(id);

    if (!current) throw new NotFoundException('Relationship not found');

    if (current.hospitalId.toString() !== hospitalId)
      throw new ForbiddenException('Access Denied');

    current.verified = !current.verified;
    await current.save();
    return current.populate('staffId patientId');
  }

  assignStaff(linkId: string, staffId: string) {
    return this.patientHospitalModel
      .findByIdAndUpdate(linkId, {
        staffId: new mongoose.Types.ObjectId(staffId),
      })
      .populate('staffId patientId');
  }
}
