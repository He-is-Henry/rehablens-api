import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { RequestLog } from './request-log.schema';

export interface RequestLogStats {
  totalRequests: number;
  avgDuration: number;
  errorCount: number;
}

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

  find(filter: QueryFilter<RequestLog>, limit = 50, cursor?: string) {
    return this.requestLogModel
      .find({ ...filter, ...(cursor && { _id: { $lt: cursor } }) })
      .sort({ _id: -1 })
      .limit(limit);
  }

  countErrorsByDay(since: Date) {
    return this.requestLogModel.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $gte: 400 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  getStats() {
    return this.requestLogModel.aggregate<RequestLogStats>([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          errorCount: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } },
        },
      },
    ]);
  }

  getSlowestEndpoints(limit = 10) {
    return this.requestLogModel.aggregate([
      {
        $group: {
          _id: { method: '$method', url: '$url' },
          avgDuration: { $avg: '$duration' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgDuration: -1 } },
      { $limit: limit },
    ]);
  }

  getErrorRateByEndpoint(limit = 10) {
    return this.requestLogModel.aggregate([
      {
        $group: {
          _id: { method: '$method', url: '$url' },
          total: { $sum: 1 },
          errors: { $sum: { $cond: [{ $gte: ['$status', 400] }, 1, 0] } },
        },
      },
      { $addFields: { errorRate: { $divide: ['$errors', '$total'] } } },
      { $match: { errors: { $gt: 0 } } },
      { $sort: { errorRate: -1 } },
      { $limit: limit },
    ]);
  }
}
