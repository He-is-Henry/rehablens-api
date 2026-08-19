import { IsEmail, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { UserRole } from 'src/user/dto/create-user.dto';

export class CreateAuthDto {}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class Payload {
  id!: mongoose.Types.ObjectId;
  customId!: string;
  role!: UserRole;
  hospitalId?: mongoose.Types.ObjectId;
}

export class PayloadUser {
  _id!: mongoose.Types.ObjectId;
  customId!: string;
  role!: UserRole;
  hospitalId?: mongoose.Types.ObjectId;
}
