import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionModule } from 'src/session/session.module';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: '5m',
        },
      }),
      inject: [ConfigService],
    }),
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
