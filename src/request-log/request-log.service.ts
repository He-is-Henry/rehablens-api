import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestLog } from './request-log.schema';

@Injectable()
export class RequestLogService {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestLogModel: Model<RequestLog>,
  ) {}

  record(data: Partial<RequestLog>) {
    this.requestLogModel.create(data).catch((err: Error) => {
      console.error(
        '[RequestLogger] Background save failed:',
        err?.message || err,
      );
    });
  }

  find(filter: Partial<RequestLog>, limit = 50, cursor?: string) {
    return this.requestLogModel
      .find({ ...filter, ...(cursor && { _id: { $lt: cursor } }) })
      .sort({ _id: -1 })
      .limit(limit);
  }
}
