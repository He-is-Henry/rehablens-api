import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Session } from './session.schema';
import mongoose, { Model } from 'mongoose';
import { CreateSessionDto } from './dto/create-session-dto';
import { UpdateSessionDto } from './dto/update-session-dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}
  hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async init(createSessionDto: CreateSessionDto) {
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
    return new this.sessionModel(createSessionDto);
  }

  getUserSessions(userId: string) {
    return this.sessionModel.find({ userId });
  }

  findById(id: string) {
    return this.sessionModel.findById(id);
  }

  getSession(userId: string, token: string) {
    const refreshToken = this.hashToken(token);
    return this.sessionModel.findOne({
      refreshToken,
      userId,
    });
  }

  updateSession(
    id: mongoose.Types.ObjectId,
    updateSessionDto: UpdateSessionDto,
  ) {
    const rt = updateSessionDto.refreshToken;
    if (rt) updateSessionDto.refreshToken = this.hashToken(rt);
    return this.sessionModel.findByIdAndUpdate(id, updateSessionDto, {
      returnDocument: 'after',
    });
  }

  deleteSessionExcept(userId: string, sessionId: string) {
    return this.sessionModel.deleteMany({
      userId,
      _id: { $ne: sessionId },
    });
  }
}
