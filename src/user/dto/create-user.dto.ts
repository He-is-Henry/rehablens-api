import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CreateUserInternalDto extends CreateUserDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsBoolean()
  isPioneer?: boolean;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
