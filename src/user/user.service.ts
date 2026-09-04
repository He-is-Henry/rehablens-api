import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserInternalDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import mongoose, { Model } from 'mongoose';
import { CounterService } from 'src/counter/counter.service';
import { LoginDto } from 'src/auth/dto/create-auth.dto';
import * as bcrypt from 'bcrypt';

interface SearchFilter {
  role: UserRole;
  hospitalId?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private counterService: CounterService,
  ) {}

  async create(createUserDto: CreateUserInternalDto) {
    const userAlreadyExists = await this.userModel.exists({
      email: createUserDto.email,
    });

    if (userAlreadyExists)
      throw new ConflictException('User email already in use');

    const role = createUserDto.role;
    const paddedSequence = await this.counterService.createCount(role);
    const keyword = this.getRoleKeyword(role);
    const password = await bcrypt.hash(createUserDto.password, 10);

    const customId = `${keyword}-${paddedSequence}`;
    return this.userModel.create({
      ...createUserDto,
      password,
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

  findAll(filter?: { hospitalId: string }) {
    return this.userModel.find(filter).select('-password');
  }

  search(query: string, role: UserRole, hospitalId?: string) {
    const regex = new RegExp(query, 'i');

    const filter: SearchFilter = {
      role,
    };

    if (hospitalId) filter.hospitalId = hospitalId;

    return this.userModel
      .find({
        ...filter,
        $or: [{ name: regex }, { customId: regex }],
      })
      .select('name customId email')
      .limit(10);
  }

  findOne(filter: Partial<UserDocument>) {
    return this.userModel.findOne(filter);
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  exists(filter: Partial<UserDocument>) {
    return this.userModel.exists(filter).lean();
  }
  existsById(id: string) {
    const _id = new mongoose.Types.ObjectId(id);
    return this.exists({ _id });
  }
  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  findOneAndUpdate(
    filter: Partial<UserDocument>,
    updateUserDto: UpdateUserDto,
  ) {
    return this.userModel
      .findOneAndUpdate(filter, updateUserDto, {
        returnDocument: 'after',
      })
      .select('-password');
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
