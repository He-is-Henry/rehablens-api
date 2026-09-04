import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Hospital } from './hospital.schema';
import mongoose, { Model } from 'mongoose';
import { CounterService } from 'src/counter/counter.service';
import { UserRole } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { CreateStaffDto } from 'src/staff/dto/create-staff.dto';
import { UpdateStaffDto } from 'src/staff/dto/update-staff.dto';
import { UserDocument } from 'src/user/user.schema';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    private userService: UserService,
    private counterService: CounterService,
    private patientHospitalService: PatientHospitalService,
  ) {}

  async create(createHospitalDto: CreateHospitalDto) {
    const hospitalAlreadyExists = await this.detectConflict(
      createHospitalDto.email,
    );

    if (hospitalAlreadyExists)
      throw new ConflictException(`hospital email in use`);

    const { admin, hospital } = await this.initHospital(createHospitalDto);
    const adminObject = admin.toObject();
    const { password, ...strippedAdmin } = adminObject;

    return {
      hospital,
      admin: strippedAdmin,
    };
  }

  // search
  search(query: string) {
    const regex = new RegExp(query, 'i');

    return this.hospitalModel
      .find({
        $or: [{ name: regex }, { customId: regex }],
      })
      .limit(10)
      .select('name customId address');
  }

  async initHospital(createHospitalDto: CreateHospitalDto) {
    const createUserDto = createHospitalDto.admin;

    const paddedSequence = await this.counterService.createCount('hospital');
    const customId = `HOSP-${paddedSequence}`;
    createHospitalDto.createdAt = new Date();
    createHospitalDto.customId = customId;

    const hospital = await this.hospitalModel.create(createHospitalDto);
    const admin = await this.userService.create({
      ...createUserDto,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId: hospital._id.toString(),
      isPioneer: true,
      isActive: true,
    });

    return { hospital, admin };
  }

  async detectConflict(hospitalMail: string): Promise<boolean> {
    const hospitalAlreadyExists = await this.hospitalModel.exists({
      email: hospitalMail,
    });
    console.log(hospitalAlreadyExists);

    return hospitalAlreadyExists ? true : false;
  }

  // staff
  async getstaff(filter: { id: string; hospitalId: string | undefined }) {
    const _id = new mongoose.Types.ObjectId(filter.id);
    const hospitalId = new mongoose.Types.ObjectId(filter.hospitalId);

    if (!hospitalId)
      throw new UnauthorizedException('You must be an hospital admin');

    const staff = await this.userService.findOne({
      _id,
      hospitalId,
    });

    if (!staff)
      throw new NotFoundException("Staff doesn't exist in organization");

    return staff;
  }

  getAllStaff(hospitalId?: string) {
    if (!hospitalId)
      throw new UnauthorizedException('You must be an hospital admin');
    return this.userService.findAll({ hospitalId });
  }

  createStaff(hospitalId: string | undefined, createStaffDto: CreateStaffDto) {
    const allowedRoles = [UserRole.HOSPITAL_ADMIN, UserRole.STAFF];

    if (!allowedRoles.includes(createStaffDto.role))
      throw new BadRequestException('Please pick the right role');

    return this.userService.create({
      ...createStaffDto,
      hospitalId,
    });
  }

  async updateStaff(
    filter: Partial<UserDocument>,
    updateStaffDto: UpdateStaffDto,
  ) {
    const updatedStaff = await this.userService.findOneAndUpdate(
      filter,
      updateStaffDto,
    );

    if (!updatedStaff) throw new NotFoundException();

    return updatedStaff;
  }

  searchStaff(query: string, hospitalId: string) {
    return this.userService.search(query, UserRole.PATIENT, hospitalId);
  }

  // patient
  async linkPatient(patientId: string, hospitalId: string, staffId?: string) {
    return this.patientHospitalService.create({
      patientId,
      staffId,
      hospitalId,
      verified: true,
    });
  }

  getLinkedPatients(hospitalId: string, filter: string) {
    const verifiedFilter =
      filter === 'verified'
        ? { verified: true }
        : filter === 'unverified'
          ? { verified: false }
          : {};

    return this.patientHospitalService.find(
      {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        ...verifiedFilter,
      },
      ['staffId', 'patientId'],
    );
  }

  toggleVerification(id: string, hospitalId: string) {
    return this.patientHospitalService.toggleVerification(id, hospitalId);
  }

  async assignStaff(linkId: string, staffId: string, adminHospitalId: string) {
    const link = await this.patientHospitalService.findById(linkId);

    if (!link) throw new NotFoundException('Relationship not found');
    const staff = await this.userService.findById(staffId).lean();

    if (!staff) throw new NotFoundException('The assigned staff was not found');

    const canAssignLink = link.hospitalId.toString() === adminHospitalId;

    if (!canAssignLink)
      throw new ForbiddenException('You are not allowed to access this link');

    const canAssignStaff = staff.hospitalId?.toString() === adminHospitalId;

    if (!canAssignStaff)
      throw new ForbiddenException('You are not allowed to assign this staff');

    return this.patientHospitalService.assignStaff(linkId, staffId);
  }

  searchPatients(query: string) {
    return this.userService.search(query, UserRole.PATIENT);
  }

  findAll() {
    return this.hospitalModel.find();
  }

  findOne(id: string | undefined) {
    if (!id) throw new BadRequestException('Id is required');
    return this.hospitalModel.findById(id);
  }

  existsById(id: string) {
    return this.hospitalModel.exists({
      _id: id,
    });
  }

  update(id: string | undefined, updateHospitalDto: UpdateHospitalDto) {
    if (!id) throw new BadRequestException('Id is required');

    return this.hospitalModel.findByIdAndUpdate(id, updateHospitalDto, {
      returnDocument: 'after',
    });
  }

  remove(id: string) {
    return this.hospitalModel.findByIdAndDelete(id);
  }
}
