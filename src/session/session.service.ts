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

  async init(createSessionDto: CreateSessionDto) {
    const clientData: ISchemaClientData = this.cls.get('clientData');
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
    return new this.sessionModel({ ...createSessionDto, ...clientData });
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
    console.log('refreshing and editing session', { clientData });
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
    if (update.pushToken)
      await this.sessionModel.updateMany(
        { pushToken: update.pushToken },
        { $unset: { pushToken: '' } },
      );

    return this.sessionModel.findOneAndUpdate(filter, update);
  }

  deleteSessionExcept(userId: string, sessionId: string) {
    return this.sessionModel.deleteMany({
      userId,
      _id: { $ne: sessionId },
    });
  }
}
