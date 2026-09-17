import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { SessionResult, SessionResultDocument } from './session-result.schema';
import { CreateSessionResultDto } from './dto/create-session-result.dto';

@Injectable()
export class SessionResultService {
  constructor(
    @InjectModel(SessionResult.name)
    private readonly sessionResultModel: Model<SessionResult>,
  ) {}

  create(dto: CreateSessionResultDto & { patientId: string }) {
    return this.sessionResultModel.create({
      ...dto,
      completedAt: new Date(),
    });
  }

  findByAssignment(assignmentId: string) {
    return this.sessionResultModel
      .find({ assignmentId })
      .sort({ completedAt: -1 });
  }

  findByPatient(patientId: string) {
    return this.sessionResultModel
      .find({ patientId })
      .sort({ completedAt: -1 })
      .populate({
        path: 'assignmentId',
        populate: { path: 'exerciseId' },
      });
  }

  count(filter: QueryFilter<SessionResultDocument>) {
    return this.sessionResultModel.countDocuments(filter);
  }

  countByDay(since: Date) {
    return this.sessionResultModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
