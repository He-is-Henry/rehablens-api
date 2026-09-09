import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionResult } from './session-result.schema';
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
}
