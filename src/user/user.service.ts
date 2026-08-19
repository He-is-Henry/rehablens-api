import { Injectable } from '@nestjs/common';
import { CreateUserInternalDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { CounterService } from 'src/counter/counter.service';
import { LoginDto } from 'src/auth/dto/create-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private counterService: CounterService,
  ) {}

  async create(createUserDto: CreateUserInternalDto) {
    const role = createUserDto.role;
    const paddedSequence = await this.counterService.createCount(role);
    const keyword = this.getRoleKeyword(role);

    const customId = `${keyword}-${paddedSequence}`;
    return this.userModel.create({
      ...createUserDto,
      customId,
    });
  }

  getRoleKeyword(role: UserRole) {
    let keyword: string;

    switch (role) {
      // super admin
      case UserRole.ADMIN:
        keyword = 'ADM';
        break;
      // hospital admin
      case UserRole.HOSPITAL_ADMIN:
        keyword = 'HAD';
        break;

      // patient
      case UserRole.PATIENT:
        keyword = 'PAT';
        break;

      // staff
      case UserRole.STAFF:
        keyword = 'STF';
        break;
    }

    return keyword;
  }

  findAll() {
    return this.userModel.find();
  }

  findById(id: string) {
    return this.userModel.findById(id).lean();
  }
  findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean();
  }

  async authenticate(loginDto: LoginDto) {
    const user = await this.findByEmail(loginDto.email).populate('hospitalId');
    if (!user)
      return {
        error: true,
        message: "Email doesn't exist",
      };

    const passwordCorect = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordCorect)
      return {
        error: true,
        message: 'Incorrect password',
      };
    const { password, ...safeUser } = user;
    return {
      error: false,
      passwordCorect,
      user: safeUser,
    };
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {
      returnDocument: 'after',
    });
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
