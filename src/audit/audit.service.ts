import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit.schema';
import { AuditAction } from './audit-action.enum';
import { ClsService } from 'nestjs-cls';
import { ISchemaClientData } from 'src/auth/decorators/client-info.decorator';

export type AuditParams = {
  action: AuditAction;
  actor: { userId: string; name: string; role: string; customId?: string };
  object?: { id?: string; name: string; type: string };
  affected?: {
    userId: string;
    name: string;
    role: string;
    customId?: string;
  }[];
  outcome?: 'success' | 'failure';
  note?: string;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    private readonly cls: ClsService,
  ) {}

  record(params: AuditParams) {
    const clientData: ISchemaClientData = this.cls.get('clientData');
    void this.auditLogModel
      .create({
        ...params,
        ...clientData,
        affected: params.affected ?? [],
        createdAt: new Date(),
      })
      .catch((e) => console.error('audit log failed', e));
  }

  findForUser(
    userId: string,
    unseenOnly: boolean,
    limit = 30,
    cursor?: string,
  ) {
    return this.auditLogModel
      .find({
        $or: [{ 'actor.userId': userId }, { 'affected.userId': userId }],
        ...(unseenOnly && {
          'affected.userId': userId,
          seenBy: { $ne: userId },
        }),
        ...(cursor && { _id: { $lt: cursor } }),
      })
      .sort({ _id: -1 })
      .limit(limit);
  }

  findNotifications(userId: string, limit = 20) {
    return this.auditLogModel
      .find({ 'affected.userId': userId })
      .sort({ _id: -1 })
      .limit(limit);
  }

  async countUnseen(userId: string) {
    const count = await this.auditLogModel.countDocuments({
      'affected.userId': userId,
      seenBy: { $ne: userId },
    });

    return { count };
  }

  markSeen(userId: string, logIds: string[]) {
    return this.auditLogModel.updateMany(
      { _id: { $in: logIds } },
      { $addToSet: { seenBy: userId } },
    );
  }

  find(filter: Partial<AuditLog>, limit = 50, cursor?: string) {
    return this.auditLogModel
      .find({ ...filter, ...(cursor && { _id: { $lt: cursor } }) })
      .sort({ _id: -1 })
      .limit(limit);
  }
}
