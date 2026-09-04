import { IsEnum } from 'class-validator';
import { CreateUserDto, UserRole } from 'src/user/dto/create-user.dto';

export class CreateStaffDto extends CreateUserDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
