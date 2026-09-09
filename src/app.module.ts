import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HospitalModule } from './hospital/hospital.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './auth/guards/roles.guard';
import { PatientModule } from './patient/patient.module';
import { StringValue } from 'ms';
import { StaffModule } from './staff/staff.module';
import { ExerciseModule } from './exercise/exercise.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<StringValue>(
            'ACCESS_TOKEN_EXPIRY',
            '5m',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HospitalModule,
    StaffModule,
    PatientModule,
    ExerciseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService,
  ],
})
export class AppModule {}
