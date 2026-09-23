import {
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
    const session = await this.sessionResultService.findById(id);
    if (!session) throw new NotFoundException('Session result not found');

    if (session.patientId.toString() !== patientId) {
      throw new ForbiddenException('Access denied');
    }

    if (session.status !== 'in_progress') {
      throw new ForbiddenException('Session is already finalized');
    }

    const status = dto.status ?? 'completed';

    const updated = await this.sessionResultService.update(id, {
      repsCompleted: dto.repsCompleted,
      durationSeconds: dto.durationSeconds,
      status,
      completedAt: new Date(),
    });

    if (status === 'completed') {
      const patient = await this.userService
        .findById(patientId)
        .select('name role customId');

      if (patient) {
        this.auditService.record({
          action: AuditAction.SESSION_COMPLETED,
          actor: {
            userId: patient._id.toString(),
            name: patient.name,
            role: patient.role,
            customId: patient.customId,
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
    }

    return updated;
  }

  async getSessionResults(patientId: string) {
    return this.sessionResultService.findByPatient(patientId);
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
