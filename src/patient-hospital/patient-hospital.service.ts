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
import { Model, QueryFilter } from 'mongoose';
import { CreatePatientHospitalDto } from './dto/create-patient-hospital.dto';
import { UserService } from 'src/user/user.service';
import mongoose from 'mongoose';
import { UserDocument } from 'src/user/user.schema';
import { Types } from 'mongoose';

export interface PopulatedPatient {
  _id: Types.ObjectId;
  name: string;
  email: string;
  customId: string;
}

export interface PopulatedStaff {
  _id: Types.ObjectId;
  name: string;
  email: string;
  customId: string;
}

export interface PopulatedHospital {
  _id: Types.ObjectId;
  name: string;
  address: string;
  email: string;
  customId: string;
}

type PopulatedFieldsMap = {
  patientId: PopulatedPatient;
  staffId: PopulatedStaff;
  hospitalId: PopulatedHospital;
};

type PopulatePath = keyof PopulatedFieldsMap;

export type WithPopulatedPaths<Doc, Paths extends PopulatePath[]> = Doc & {
  [K in Paths[number]]: PopulatedFieldsMap[K];
};

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

  async find<P extends PopulatePath[]>(
    filter: QueryFilter<PatientHospitalDocument>,
    populate: P,
  ): Promise<WithPopulatedPaths<PatientHospitalDocument, P>[]> {
    type LocalPopulatePath = 'patientId' | 'staffId' | 'hospitalId';

    const POPULATE_FIELDS: Record<LocalPopulatePath, string> = {
      patientId: 'name email customId',
      staffId: 'name email customId',
      hospitalId: 'name address email customId',
    };

    const result = await this.patientHospitalModel.find(filter).populate(
      populate.map((p) => ({
        path: p,
        select: POPULATE_FIELDS[p],
      })),
    );

    return result as unknown as WithPopulatedPaths<
      PatientHospitalDocument,
      P
    >[];
  }

  async findOne<P extends PopulatePath[]>(
    filter: QueryFilter<PatientHospitalDocument>,
    populate: P,
  ): Promise<WithPopulatedPaths<PatientHospitalDocument, P> | null> {
    type LocalPopulatePath = 'patientId' | 'staffId' | 'hospitalId';

    const POPULATE_FIELDS: Record<LocalPopulatePath, string> = {
      patientId: 'name email customId',
      staffId: 'name email customId',
      hospitalId: 'name address email customId',
    };

    const result = await this.patientHospitalModel.findOne(filter).populate(
      populate.map((p) => ({
        path: p,
        select: POPULATE_FIELDS[p],
      })),
    );

    return result as unknown as WithPopulatedPaths<
      PatientHospitalDocument,
      P
    > | null;
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
    return current.populate<{ staffId: UserDocument; patientId: UserDocument }>(
      'staffId patientId',
    );
  }

  assignStaff(linkId: string, staffId: string) {
    return this.patientHospitalModel
      .findByIdAndUpdate(
        linkId,
        {
          staffId: new mongoose.Types.ObjectId(staffId),
        },
        { returnDocument: 'after' },
      )
      .populate<{ staffId: UserDocument; patientId: UserDocument }>(
        'staffId patientId',
      );
  }
}
