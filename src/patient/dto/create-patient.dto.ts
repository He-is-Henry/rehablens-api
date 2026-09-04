import { IsString } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class CreatePatientDto extends CreateUserDto {
  @IsString()
  hospitalId!: string;
}
