import { Allow, IsEmail, IsObject, IsString } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class CreateHospitalDto {
  @IsString()
  name!: string;

  @Allow()
  customId!: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsString()
  email!: string;

  @IsString()
  phone?: string;

  @IsString()
  address!: string;

  @Allow()
  createdAt!: Date;

  @IsObject()
  admin!: CreateUserDto;
}
