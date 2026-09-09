import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole } from 'src/user/dto/create-user.dto';

export class CreateStaffDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
