import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Session } from './session.schema';
import { Model } from 'mongoose';
import { CreateSessionDto } from './dto/create-session-dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}
  hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(createSessionDto: CreateSessionDto) {
    const filter = { userId: createSessionDto.userId };

    const extraSessions = await this.sessionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(4)
      .select('_id')
      .exec();

    if (extraSessions.length > 0) {
      const idsToDelete = extraSessions.map((s) => s._id);
      await this.sessionModel.deleteMany({ _id: { $in: idsToDelete } });
    }

    const hashedToken = this.hashToken(createSessionDto.refreshToken);
    createSessionDto.refreshToken = hashedToken;

    const session = await this.sessionModel.create(createSessionDto);
    return session;
  }
}
