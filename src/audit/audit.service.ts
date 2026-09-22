import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit.schema';
import { AuditAction } from './audit-action.enum';
import { ClsService } from 'nestjs-cls';
import { ISchemaClientData } from 'src/auth/decorators/client-info.decorator';
import {
  AuditLogEntry,
  renderAuditNotification,
} from './audit-notification-formatter';
import { NotificationService } from 'src/notification/notification.service';

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
    private readonly notificationService: NotificationService,
  ) {}

  record(params: AuditParams) {
    const clientData: ISchemaClientData = this.cls.get('clientData');
    const currentSessionId: string | undefined = this.cls.get('sessionId');
    void this.auditLogModel
      .create({
        ...params,
        ...clientData,
        affected: params.affected ?? [],
        createdAt: new Date(),
      })
      .then((createdLog) => {
        this.dispatchNotification(
          createdLog.toObject(),
          params,
          currentSessionId,
        );
      })
      .catch((e) => console.error('audit log failed', e));
  }

  private dispatchNotification(
    logEntry: AuditLogEntry,
    params: AuditParams,
    currentSessionId?: string,
  ) {
    if (params.action === AuditAction.LOGIN) {
      const payload = renderAuditNotification(logEntry, params.actor.userId);
      console.log('[AUDIT] LOGIN notification payload:', payload);

    if (!payload) return;

    console.log('[AUDIT] Sending LOGIN push:', {
      userId: params.actor.userId,
      excludeSessionId: currentSessionId,
    });
      
      void this.notificationService.sendToUser(
        params.actor.userId,
        payload.title,
        payload.body,
        { excludeSessionId: currentSessionId },
      );
      return;
    }

    if (!params.affected?.length) return;

    for (const target of params.affected) {
      if (target.userId === params.actor.userId) continue;

      const payload = renderAuditNotification(logEntry, target.userId);
      if (!payload) continue;

      void this.notificationService.sendToUser(
        target.userId,
        payload.title,
        payload.body,
        {
          data: {
            action: params.action,
            objectId: params.object?.id,
            objectType: params.object?.type,
          },
        },
      );
    }
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
