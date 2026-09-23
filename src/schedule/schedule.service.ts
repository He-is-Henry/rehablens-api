import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Schedule } from './schedule.schema';

type ScheduleEntry = {
  scheduledDate: string;
  minSessions?: number;
  maxSessions?: number | null;
};

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
  ) {}

  async createMany(params: {
    assignmentId: string;
    patientId: string;
    hospitalId: string;
    entries: ScheduleEntry[];
  }) {
    const { assignmentId, patientId, hospitalId, entries } = params;

    const existing = await this.scheduleModel
      .find({
        assignmentId,
        scheduledDate: { $in: entries.map((e) => e.scheduledDate) },
      })
      .select('scheduledDate');
    const existingDates = new Set(existing.map((e) => e.scheduledDate));

    const toCreate = entries.filter((e) => !existingDates.has(e.scheduledDate));

    const created = toCreate.length
      ? await this.scheduleModel.insertMany(
          toCreate.map((e) => ({
            assignmentId,
            patientId,
            hospitalId,
            scheduledDate: e.scheduledDate,
            minSessions: e.minSessions ?? 1,
            maxSessions: e.maxSessions ?? null,
          })),
        )
      : [];

    return {
      created,
      skipped: entries
        .filter((e) => existingDates.has(e.scheduledDate))
        .map((e) => e.scheduledDate),
    };
  }

  findByAssignment(assignmentId: string) {
    return this.scheduleModel.find({ assignmentId }).sort({ scheduledDate: 1 });
  }

  findById(id: string) {
    return this.scheduleModel.findById(id);
  }

  findFutureForAssignment(assignmentId: string, fromDate: string) {
    return this.scheduleModel.find({
      assignmentId,
      scheduledDate: { $gte: fromDate }, // "YYYY-MM-DD" strings sort correctly lexicographically
    });
  }

  findForPatient(params: {
    patientId: string;
    hospitalIds: string[];
    date?: string;
    cursor?: string;
    limit?: number;
  }) {
    const { patientId, hospitalIds, date, cursor, limit = 20 } = params;

    return this.scheduleModel
      .find({
        patientId,
        hospitalId: { $in: hospitalIds },
        ...(date && { scheduledDate: date }),
        ...(cursor && { _id: { $gt: cursor } }),
      })
      .sort({ _id: 1 })
      .limit(limit)
      .populate({ path: 'assignmentId', populate: { path: 'exerciseId' } });
  }
  async update(
    id: string,
    hospitalId: string,
    dto: {
      scheduledDate?: string;
      minSessions?: number;
      maxSessions?: number | null;
    },
  ) {
    const schedule = await this.findById(id);
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.hospitalId.toString() !== hospitalId) {
      throw new ForbiddenException('Access denied');
    }

    if (dto.scheduledDate && dto.scheduledDate !== schedule.scheduledDate) {
      const conflict = await this.scheduleModel.exists({
        assignmentId: schedule.assignmentId,
        scheduledDate: dto.scheduledDate,
      });
      if (conflict)
        throw new ConflictException('A schedule already exists on that date');
    }
    Object.assign(schedule, dto);

    return schedule.save();
  }

  async delete(id: string, hospitalId: string) {
    const schedule = await this.findById(id);
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.hospitalId.toString() !== hospitalId) {
      throw new ForbiddenException('Access denied');
    }
    await schedule.deleteOne();
    return schedule;
  }

  deleteMany(ids: string[]) {
    return this.scheduleModel.deleteMany({ _id: { $in: ids } });
  }

  async deleteFutureByAssignment(assignmentId: string) {
    const today = new Date().toISOString().split('T')[0];

    return this.scheduleModel.deleteMany({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      scheduledDate: { $gte: today },
    });
  }

  async deleteAllByAssignment(assignmentId: string) {
    return this.scheduleModel.deleteMany({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });
  }
}
