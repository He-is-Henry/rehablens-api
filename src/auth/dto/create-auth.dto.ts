import { IsEmail, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { HospitalDocument } from 'src/hospital/hospital.schema';
import { UserRole } from 'src/user/dto/create-user.dto';

export class CreateAuthDto {}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class Payload {
  id!: string;
  customId!: string;
  role!: UserRole;
  sessionId!: string;
  hospitalId?: string;
  mustChangePassword!: boolean;
}

export class ResetPayload {
  userId!: string;
  code!: string;
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  token?: string;

  @IsString()
  email!: string;

  @IsString()
  newPassword!: string;

  @IsString()
  @IsOptional()
  manualCode?: string;
}

export class PayloadUser {
  _id!: mongoose.Types.ObjectId;
  customId!: string;
  role!: UserRole;
  hospitalId?: HospitalDocument;
  mustChangePassword!: boolean;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ChangeInitialPasswordDto {
  @IsString()
  newPassword!: string;
}
export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  newPassword!: string;
}
