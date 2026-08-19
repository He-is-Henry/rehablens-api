import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDto, Payload, PayloadUser } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ISchemaClientData } from './decorators/client-info.decorator';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  async login(loginDto: LoginDto, clientData: ISchemaClientData) {
    const authResult = await this.userService.authenticate(loginDto);

    if (authResult.error || !authResult.passwordCorect) {
      throw new UnauthorizedException(authResult.message);
    }

    const user = authResult.user;
    const { accessToken, refreshToken } = this.signTokens(user);

    const session = await this.sessionService.create({
      ...clientData,
      userId: user._id.toString(),
      refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      ...user,
      session,
    };
  }

  signTokens(user: PayloadUser) {
    const payload: Payload = {
      id: user._id,
      customId: user.customId,
      role: user.role,
      hospitalId: user.hospitalId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
