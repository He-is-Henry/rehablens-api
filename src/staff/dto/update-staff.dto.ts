import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'src/user/dto/create-user.dto';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignStaffDto {
  @IsString()
  staffId!: string;
}

export class LinkPatientDto {
  staffId?: string;
}
