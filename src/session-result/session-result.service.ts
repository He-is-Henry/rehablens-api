import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types, UpdateQuery } from 'mongoose';
import { SessionResult, SessionResultDocument } from './session-result.schema';
import { CreateSessionResultDto } from './dto/create-session-result.dto';
import { UpdateSessionResultDto } from './dto/update-session-result';

export interface LeaderboardPointRow {
  hospitalId: Types.ObjectId;
  patientId: Types.ObjectId;
  totalPoints: number;
}

export interface PopulatedPatientHospital {
  hospitalId: Types.ObjectId;
  patientId: {
    _id: Types.ObjectId;
    name: string;
    customId: string;
  };
  verified: boolean;
}

@Injectable()
export class SessionResultService {
  constructor(
    @InjectModel(SessionResult.name)
    private readonly sessionResultModel: Model<SessionResult>,
  ) {}

  create(dto: CreateSessionResultDto & { patientId: string }) {
    return this.sessionResultModel.create({
      ...dto,
      repsCompleted: dto.repsCompleted ?? 0,
      durationSeconds: dto.durationSeconds ?? 0,
    });
  }

  findOne(filter: QueryFilter<SessionResultDocument>) {
    return this.sessionResultModel.findOne(filter);
  }

  findById(id: string) {
    return this.sessionResultModel.findById(id);
  }

  update(id: string, dto: UpdateSessionResultDto) {
    return this.sessionResultModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
  }

  updateMany(
    filter: QueryFilter<SessionResultDocument>,
    update: UpdateQuery<SessionResultDocument>,
  ) {
    return this.sessionResultModel.updateMany(filter, update);
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

  calculatePoints(params: {
    repsCompleted: number;
    targetReps: number;
    holdSeconds: number;
    repTriggerCount: number;
  }): number {
    const { repsCompleted, targetReps, holdSeconds, repTriggerCount } = params;

    const completionRatio = Math.min(repsCompleted / targetReps, 1);
    const difficultyMultiplier =
      1 + holdSeconds / 10 + Math.max(0, repTriggerCount - 1) * 0.5;

    return Math.round(completionRatio * 10 * difficultyMultiplier);
  }

  async getLeaderboardPoints(
    hospitalIds: Types.ObjectId[],
    timeframe: 'weekly' | 'lifetime',
  ): Promise<LeaderboardPointRow[]> {
    const targetHospitalStrings = hospitalIds.map((id) => id.toString());
    const matchStage: Record<string, any> = { status: 'completed' };

    if (timeframe === 'weekly') {
      const now = new Date();
      const currentDay = now.getUTCDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

      const startOfWeek = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - daysToMonday,
        ),
      );
      startOfWeek.setUTCHours(0, 0, 0, 0);

      matchStage.completedAt = { $gte: startOfWeek };
    }

    return this.sessionResultModel.aggregate<LeaderboardPointRow>([
      { $match: matchStage },
      {
        $lookup: {
          from: 'schedules',
          let: { searchScheduleId: '$scheduleId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: '$_id' },
                    { $toString: '$$searchScheduleId' },
                  ],
                },
              },
            },
          ],
          as: 'schedule',
        },
      },
      { $unwind: '$schedule' },
      {
        $match: {
          $expr: {
            $in: [{ $toString: '$schedule.hospitalId' }, targetHospitalStrings],
          },
        },
      },
      {
        $group: {
          _id: {
            hospitalId: '$schedule.hospitalId',
            patientId: '$patientId',
          },
          totalPoints: { $sum: '$pointsAwarded' },
        },
      },
      {
        $project: {
          _id: 0,
          hospitalId: '$_id.hospitalId',
          patientId: '$_id.patientId',
          totalPoints: 1,
        },
      },
    ]);
  }
}
