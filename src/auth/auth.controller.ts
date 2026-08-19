import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import {
  ClientData,
  type ISchemaClientData,
} from './decorators/client-info.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @ClientData() clientData: ISchemaClientData,
  ) {
    return this.authService.login(loginDto, clientData);
  }
}
