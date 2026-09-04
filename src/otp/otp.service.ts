import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OTP } from './otp.schema';
import { Model } from 'mongoose';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly sessionService: SessionService,
    @InjectModel(OTP.name) private readonly otpModel: Model<OTP>,
  ) {}

  upsert(userId: string, rawToken: string, code: string) {
    const token = this.sessionService.hashToken(rawToken);
    return this.otpModel.findOneAndUpdate(
      { userId },
      {
        token,
        attempts: 0,
        code,
      },
      { upsert: true, returnDocument: 'after' },
    );
  }

  findByUserId(userId: string) {
    return this.otpModel.findOne({ userId });
  }

  findByToken(rawToken: string) {
    const token = this.sessionService.hashToken(rawToken);
    return this.otpModel.findOne({ token });
  }

  incrementAttempts(userId: string) {
    return this.otpModel.findOneAndUpdate(
      { userId },
      {
        $inc: {
          attempts: 1,
        },
      },
    );
  }

  delete(userId: string) {
    return this.otpModel.findOneAndDelete({ userId });
  }
}
