import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Session, SessionDocument } from './session.schema';
import mongoose, { Model, QueryFilter } from 'mongoose';
import { CreateSessionDto } from './dto/create-session-dto';
import { UpdateSessionDto } from './dto/update-session-dto';
import { ClsService } from 'nestjs-cls';
import { ISchemaClientData } from 'src/auth/decorators/client-info.decorator';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly cls: ClsService,
  ) {}

  hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async detachPushToken(pushToken?: string) {
    if (!pushToken) return;
    await this.sessionModel.updateMany(
      { pushToken },
      { $unset: { pushToken: '' } },
    );
  }

  async init(createSessionDto: CreateSessionDto) {
    const clientData: ISchemaClientData = this.cls.get('clientData');
    const filter = { userId: createSessionDto.userId };

    // 1. Ensure this pushToken is not attached to any other session (across any user)
    if (createSessionDto.pushToken) {
      await this.detachPushToken(createSessionDto.pushToken);
    }

    // 2. Cap maximum sessions per user to 5
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

    // 3. Create the new session
    const session = new this.sessionModel({
      ...createSessionDto,
      ...clientData,
    });
    return session.save();
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
    const clientData: ISchemaClientData = this.cls.get('clientData');
    const rt = updateSessionDto.refreshToken;
    if (rt) updateSessionDto.refreshToken = this.hashToken(rt);

    return this.sessionModel.findByIdAndUpdate(
      id,
      {
        ...updateSessionDto,
        ...clientData,
      },
      {
        returnDocument: 'after',
      },
    );
  }

  async findOneAndUpdate(
    filter: QueryFilter<SessionDocument>,
    update: QueryFilter<Session>,
  ) {
    if (typeof update.pushToken === 'string') {
      await this.detachPushToken(update.pushToken);
    }

    return this.sessionModel.findOneAndUpdate(filter, update, {
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
