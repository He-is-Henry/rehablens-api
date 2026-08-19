import { ConflictException, Injectable } from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Hospital } from './hospital.schema';
import { Model } from 'mongoose';
import { CounterService } from 'src/counter/counter.service';
import { CreateUserDto, UserRole } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    private userService: UserService,
    private counterService: CounterService,
  ) {}

  async create(createHospitalDto: CreateHospitalDto) {
    const createUserDto: CreateUserDto = createHospitalDto.admin;

    const conflictFlag = await this.detectConflict(
      createUserDto.email,
      createHospitalDto.email,
    );

    if (conflictFlag)
      return new ConflictException(`${conflictFlag} email in use`);

    const paddedSequence = await this.counterService.createCount('hospital');
    const customId = `HOSP-${paddedSequence}`;
    createHospitalDto.createdAt = new Date();
    createHospitalDto.customId = customId;

    const hospital = await this.hospitalModel.create(createHospitalDto);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const admin = await this.userService.create({
      email: createUserDto.email,
      password: hashedPassword,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId: hospital._id,
      isActive: true,
    });

    const adminObject = admin.toObject();
    const { password, ...strippedAdmin } = adminObject;

    return {
      hospital,
      admin: strippedAdmin,
    };
  }

  async detectConflict(
    userEmail: string,
    hospitalMail: string,
  ): Promise<'Hospital' | 'Admin' | undefined> {
    const adminAlreadyExists = await this.userService.findByEmail(userEmail);

    const hospitalAlreadyExists = await this.hospitalModel.findOne({
      email: hospitalMail,
    });

    if (hospitalAlreadyExists) return 'Hospital';
    else if (adminAlreadyExists) return 'Admin';
  }

  findAll() {
    return this.hospitalModel.find();
  }

  findOne(id: string) {
    return this.hospitalModel.findById(id);
  }

  update(id: string, updateHospitalDto: UpdateHospitalDto) {
    return this.hospitalModel.findByIdAndUpdate(id, updateHospitalDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.hospitalModel.findByIdAndDelete(id);
  }
}
