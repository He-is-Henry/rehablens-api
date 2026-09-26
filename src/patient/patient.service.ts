import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';
import { UserRole } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreatePatientHospitalDto } from 'src/patient-hospital/dto/create-patient-hospital.dto';
import { HospitalService } from 'src/hospital/hospital.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import mongoose from 'mongoose';
import { AssignmentStatus } from 'src/assignment/dto/create-assignment.dto';
import { ScheduleService } from 'src/schedule/schedule.service';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit-action.enum';
import { FinishSessionResultDto } from 'src/session-result/dto/finish-session-result.dto';
import { StartSessionResultDto } from 'src/session-result/dto/start-session-result.dto';
import { GetPatientSchedulesQueryDto } from 'src/session-result/dto/get-patient-schedules-query.dto';
import { SessionResultService } from 'src/session-result/session-result.service';
import {
  LeaderboardHospital,
  LeaderboardService,
} from 'src/leaderboard/leaderboard.service';
import { SessionResultDocument } from 'src/session-result/session-result.schema';

@Injectable()
export class PatientService {
  constructor(
    private readonly userService: UserService,
    private readonly patientHospitalService: PatientHospitalService,
    private readonly hospitalService: HospitalService,
    private readonly sessionResultService: SessionResultService,
    private readonly assignmentService: AssignmentService,
    private readonly scheduleService: ScheduleService,
    private readonly auditService: AuditService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    if (!mongoose.Types.ObjectId.isValid(createPatientDto.hospitalId))
      throw new NotFoundException('The hospital you provided does not exist');

    const hospitalExists = await this.hospitalService
      .findOne(createPatientDto.hospitalId)
      .select('name');

    if (!hospitalExists)
      throw new NotFoundException('The hospital you provided does not exist');

    const patient = await this.userService.create({
      ...createPatientDto,
      hospitalId: undefined,
      role: UserRole.PATIENT,
    });

    const createPatientHospitalDto: CreatePatientHospitalDto = {
      patientId: patient._id.toString(),
      hospitalId: createPatientDto.hospitalId,
    };

    await this.patientHospitalService.create(createPatientHospitalDto);
    return {
      message: 'Patient account created successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        customId: patient.customId,
        role: patient.role,
      },
    };
  }

  getHospitals(id: string) {
    const patientId = new mongoose.Types.ObjectId(id);
    return this.patientHospitalService.find({ patientId }, [
      'staffId',
      'hospitalId',
    ]);
  }

  getHospital(id: string, linkId: string) {
    const patientId = new mongoose.Types.ObjectId(id);
    const _id = new mongoose.Types.ObjectId(linkId);
    return this.patientHospitalService.findOne({ _id, patientId }, [
      'staffId',
      'hospitalId',
    ]);
  }

  async sendHospitalRequest(patientId: string, hospitalId: string) {
    const hospitalExists = await this.hospitalService.existsById(hospitalId);

    if (!hospitalExists)
      throw new NotFoundException('This Hospital does not exist');

    return this.patientHospitalService.create({
      hospitalId,
      patientId,
    });
  }

  async getSchedules(patientId: string, query: GetPatientSchedulesQueryDto) {
    const links = await this.patientHospitalService.find(
      { patientId: new mongoose.Types.ObjectId(patientId), verified: true },
      [],
    );
    const verifiedHospitalIds = links.map((l) => l.hospitalId.toString());

    let hospitalIds: string[];
    if (query.hospitalId) {
      if (!verifiedHospitalIds.includes(query.hospitalId)) {
        throw new ForbiddenException('Not linked to this hospital');
      }
      hospitalIds = [query.hospitalId];
    } else {
      hospitalIds = verifiedHospitalIds;
    }

    if (!hospitalIds.length) return [];

    return this.scheduleService.findForPatient({
      patientId,
      hospitalIds,
      date: query.date,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  async getScheduleById(patientId: string, scheduleId: string) {
    const schedule = await this.scheduleService.findById(scheduleId);

    if (!schedule) throw new NotFoundException('Schedule not found');

    if (schedule?.patientId.toString() !== patientId)
      throw new ForbiddenException('Access denied');

    return schedule.populate({
      path: 'assignmentId',
      populate: { path: 'exerciseId' },
    });
  }

  private isWithinGraceWindow(
    scheduledDate: string, // "YYYY-MM-DD"
    timeZone: string = 'UTC',
    graceHours = 3,
  ): boolean {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const getPart = (type: string) =>
        parts.find((p) => p.type === type)?.value;

      const year = getPart('year');
      const month = getPart('month');
      const day = getPart('day');
      let hour = parseInt(getPart('hour') || '0', 10);
      if (hour === 24) hour = 0;

      const patientToday = `${year}-${month}-${day}`;

      const [sY, sM, sD] = scheduledDate.split('-').map(Number);
      const nextDayObj = new Date(Date.UTC(sY, sM - 1, sD + 1));
      const nextDayStr = nextDayObj.toISOString().split('T')[0];

      if (patientToday === scheduledDate) {
        return true;
      }

      if (patientToday === nextDayStr && hour < graceHours) {
        return true;
      }

      return false;
    } catch {
      // Fallback to strict date string comparison if timezone string is invalid
      const today = new Date().toISOString().split('T')[0];
      return scheduledDate === today;
    }
  }

  async startSessionResult(dto: StartSessionResultDto, patientId: string) {
    const assignment = await this.assignmentService.findById(dto.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.patientId.toString() !== patientId) {
      throw new ForbiddenException('Access denied');
    }

    if (assignment.status !== 'active') {
      throw new ForbiddenException('Inactive assignment');
    }

    const schedule = await this.scheduleService.findById(dto.scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');

    if (!this.isWithinGraceWindow(schedule.scheduledDate, dto.timeZone)) {
      throw new ForbiddenException(
        'This schedule is no longer available to start',
      );
    }

    // 1. Check if a session is already in progress for this schedule
    const existingSession = await this.sessionResultService.findOne({
      scheduleId: dto.scheduleId,
      patientId,
      status: 'in_progress',
    });

    // 2. Return existing session to make endpoint idempotent
    if (existingSession) {
      return existingSession;
    }

    // 3. Otherwise, create a new session result
    return this.sessionResultService.create({
      assignmentId: dto.assignmentId,
      scheduleId: dto.scheduleId,
      patientId,
      targetReps: assignment.customReps ?? assignment.exerciseId.targetReps,
      repsCompleted: 0,
      durationSeconds: 0,
      status: 'in_progress',
    });
  }

  async finishSessionResult(
    id: string,
    dto: FinishSessionResultDto,
    patientId: string,
  ) {
    let session: SessionResultDocument | null = null;

    if (!id.startsWith('offline')) {
      session = await this.sessionResultService.findById(id);
    }

    if (!session) {
      if (!dto.assignmentId || !dto.scheduleId) throw new BadRequestException();

      await this.sessionResultService.updateMany(
        { scheduleId: dto.scheduleId, patientId, status: 'in_progress' },
        { status: 'abandoned', completedAt: new Date() },
      );

      const assignment = await this.assignmentService.findById(
        dto.assignmentId,
      );
      if (!assignment) throw new NotFoundException('Assignment not found');
      if (assignment.patientId.toString() !== patientId)
        throw new ForbiddenException('Access denied');
      if (assignment.status !== 'active')
        throw new ForbiddenException('Inactive assignment');

      const schedule = await this.scheduleService.findById(dto.scheduleId);
      if (!schedule) throw new NotFoundException('Schedule not found');
      if (!this.isWithinGraceWindow(schedule.scheduledDate, dto.timeZone))
        throw new ForbiddenException('This schedule is no longer available');

      session = await this.sessionResultService.create({
        assignmentId: dto.assignmentId,
        scheduleId: dto.scheduleId,
        patientId,
        targetReps: assignment.customReps ?? assignment.exerciseId.targetReps,
        repsCompleted: 0,
        durationSeconds: 0,
        status: 'in_progress',
      });
    }

    if (session.patientId.toString() !== patientId) {
      throw new ForbiddenException('Access denied');
    }

    if (session.status !== 'in_progress') {
      console.log(session.status);

      throw new ForbiddenException('Session is already finalized');
    }

    const status = dto.status ?? 'completed';

    if (status !== 'completed') {
      const updatedAbandoned = await this.sessionResultService.update(
        session._id.toString(),
        {
          status: 'abandoned',
          repsCompleted: dto.repsCompleted ?? 0,
          durationSeconds: dto.durationSeconds ?? 0,
          completedAt: new Date(),
          pointsAwarded: 0,
        },
      );

      return {
        session: updatedAbandoned,
        pointsAwarded: 0,
        streakExtended: false,
        newStreak: undefined,
        rankMovedUp: false,
        previousRank: -1,
        newRank: -1,
      };
    }

    const assignment = await this.assignmentService.findById(
      session.assignmentId.toString(),
    );
    const exercise = assignment?.exerciseId;

    const pointsAwarded = this.sessionResultService.calculatePoints({
      repsCompleted: dto.repsCompleted,
      targetReps: session.targetReps,
      holdSeconds: exercise?.holdSeconds ?? 0,
      repTriggerCount: exercise?.repTriggers?.length ?? 1,
    });

    const myLinks = await this.patientHospitalService.find(
      { verified: true, patientId: new mongoose.Types.ObjectId(patientId) },
      [],
    );

    const hospitalIdStrings = myLinks.map((l) => l.hospitalId.toString());

    // Snapshot pre-completion standings
    const initialRanks = hospitalIdStrings.map((hId) => ({
      hospitalId: hId,
      rank: this.leaderboardService.getRank(patientId, hId, 'lifetime'),
    }));

    // 3. Save performance metrics to the database
    const updated = await this.sessionResultService.update(
      session._id.toString(),
      {
        repsCompleted: dto.repsCompleted,
        durationSeconds: dto.durationSeconds,
        status: 'completed',
        completedAt: new Date(),
        pointsAwarded,
      },
    );

    // 4. Update the corresponding execution counters
    const scheduleId = updated?.scheduleId;
    if (scheduleId) {
      await this.scheduleService.incrementCompletedCount(scheduleId.toString());
    }

    // 5. Invalidate outdated caches and force an instant update loop to calculate new ranks
    this.leaderboardService.invalidate(hospitalIdStrings);

    let rankMovedUp = false;
    let previousRank = -1;
    let newRank = -1;

    for (const hId of hospitalIdStrings) {
      await this.getLeaderboard(patientId, 'lifetime');

      const oldRankInfo = initialRanks.find((r) => r.hospitalId === hId);
      const nextRank = this.leaderboardService.getRank(
        patientId,
        hId,
        'lifetime',
      );

      if (
        oldRankInfo &&
        oldRankInfo.rank !== -1 &&
        nextRank !== -1 &&
        nextRank < oldRankInfo.rank
      ) {
        rankMovedUp = true;
        previousRank = oldRankInfo.rank;
        newRank = nextRank;
      }
    }

    // 6. Enforce early return if patient profile target lookup fails
    const patient = await this.userService
      .findById(patientId)
      .select('name role customId currentStreak lastCompletedDate');

    if (!patient) {
      return {
        session: updated,
        pointsAwarded,
        streakExtended: false,
        newStreak: undefined,
        rankMovedUp,
        previousRank,
        newRank,
      };
    }

    // 7. Process remaining streak calculations and records
    const today = this.getLocalDateString(dto.timeZone);
    const yesterday = this.getYesterdayDateString(today);
    const currentStreak = patient.currentStreak ?? 0;
    let streakExtended = false;
    let newStreak: number;

    if (patient.lastCompletedDate === today) {
      newStreak = currentStreak;
    } else if (patient.lastCompletedDate === yesterday) {
      newStreak = currentStreak + 1;
      streakExtended = true;
    } else {
      newStreak = 1;
      streakExtended = true;
    }

    patient.currentStreak = newStreak;
    patient.lastCompletedDate = today;
    await patient.save();

    if (exercise) {
      this.auditService.record({
        action: AuditAction.SESSION_COMPLETED,
        actor: {
          userId: patient._id.toString(),
          name: patient.name,
          role: patient.role,
          customId: patient.customId,
        },
        object: {
          id: exercise._id.toString(),
          name: exercise.name,
          type: 'exercise',
        },
        affected: [
          {
            userId: patient._id.toString(),
            name: patient.name,
            role: patient.role,
            customId: patient.customId,
          },
        ],
      });
    }

    return {
      session: updated,
      pointsAwarded,
      streakExtended,
      newStreak,
      rankMovedUp,
      previousRank,
      newRank,
    };
  }

  private getLocalDateString(timeZone: string = 'UTC'): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(new Date());
      const getPart = (type: string) =>
        parts.find((p) => p.type === type)?.value;

      return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  private getYesterdayDateString(todayStr: string): string {
    const [year, month, day] = todayStr.split('-').map(Number);
    const yesterdayObj = new Date(Date.UTC(year, month - 1, day - 1));
    return yesterdayObj.toISOString().split('T')[0];
  }

  async getSessionResults(patientId: string) {
    return this.sessionResultService.findByPatient(patientId);
  }

  async getLeaderboard(id: string, timeframe: 'weekly' | 'lifetime') {
    const patient = await this.userService.findById(id);
    if (!patient) throw new NotFoundException();

    // Patient's own verified links
    const myLinks = await this.patientHospitalService.find(
      { verified: true, patientId: new mongoose.Types.ObjectId(id) },
      [],
    );
    const hospitalIds = myLinks.map((l) => l.hospitalId);
    if (!hospitalIds.length) return [];

    const hospitalIdStrings = hospitalIds.map((hId) => hId.toString());
    const finalLeaderboard: LeaderboardHospital[] = [];
    const hospitalsToFetchFromDb: mongoose.Types.ObjectId[] = [];

    // 1. Try serving individual hospital blocks from memory cache first
    for (const hId of hospitalIdStrings) {
      const cachedData = this.leaderboardService.get(hId, timeframe);
      if (cachedData) {
        finalLeaderboard.push(cachedData);
      } else {
        hospitalsToFetchFromDb.push(new mongoose.Types.ObjectId(hId));
      }
    }

    // If every linked hospital hit the cache, short-circuit immediately!
    if (hospitalsToFetchFromDb.length === 0) {
      return finalLeaderboard;
    }

    // 2. Otherwise, fall back to aggregate lookups ONLY for missing cache blocks
    const allLinks = await this.patientHospitalService.find(
      { verified: true, hospitalId: { $in: hospitalsToFetchFromDb } },
      ['patientId', 'hospitalId'],
    );

    const leaderboardRows =
      await this.sessionResultService.getLeaderboardPoints(
        hospitalsToFetchFromDb,
        timeframe,
      );

    const pointsByKey = new Map<string, number>();

    for (const row of leaderboardRows) {
      pointsByKey.set(
        `${row.hospitalId.toString()}:${row.patientId.toString()}`,
        row.totalPoints,
      );
    }

    const tempMap = new Map<
      string,
      {
        hospitalId: string;
        hospitalName: string;
        patients: {
          patientId: string;
          name: string;
          customId: string;
          points: number;
        }[];
      }
    >();

    for (const link of allLinks) {
      const hId = link.hospitalId._id.toString();
      const hName = link.hospitalId.name;
      const p = link.patientId;

      if (!tempMap.has(hId)) {
        tempMap.set(hId, {
          hospitalId: hId,
          hospitalName: hName,
          patients: [],
        });
      }

      tempMap.get(hId)!.patients.push({
        patientId: p._id.toString(),
        name: p.name,
        customId: p.customId,
        points: pointsByKey.get(`${hId}:${p._id.toString()}`) ?? 0,
      });
    }

    // 3. Sort, commit freshly aggregated rows to the cache, and bundle to response
    for (const [hId, data] of tempMap.entries()) {
      data.patients.sort((a, b) => b.points - a.points);
      this.leaderboardService.set(hId, timeframe, data);
      finalLeaderboard.push(data);
    }

    return finalLeaderboard;
  }

  async getSessionResultsByAssignment(assignmentId: string, patientId: string) {
    const assignment = await this.assignmentService.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.patientId.toString() !== patientId) {
      throw new ForbiddenException('Access denied');
    }

    return this.sessionResultService.findByAssignment(assignmentId);
  }

  async getAssignments(
    patientId: string,
    hospitalId?: string,
    status?: AssignmentStatus,
  ) {
    return this.assignmentService.findByPatient(patientId, hospitalId, status);
  }

  async getAssignmentById(id: string, patientId: string) {
    const assignment = await this.assignmentService.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.patientId.toString() !== patientId) {
      throw new ForbiddenException('Access denied');
    }
    return assignment;
  }
}
