import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import mongoose from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CreateUserInternalDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  hospitalId?: mongoose.Types.ObjectId;

  @IsBoolean()
  isActive?: boolean;
}
