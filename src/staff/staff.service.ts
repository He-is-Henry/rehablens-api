import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { UpdateAssignmentDto } from 'src/assignment/dto/update-assignment.dto';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';
import { SessionResultService } from 'src/session-result/session-result.service';
import { UserService } from 'src/user/user.service';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/audit-action.enum';
import { ScheduleService } from 'src/schedule/schedule.service';
import { UpdateScheduleDto } from 'src/schedule/dto/update-schedule.dto';
import { CreateSchedulesDto } from 'src/schedule/dto/create-schedule.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly patientHospitalService: PatientHospitalService,
    private readonly userService: UserService,
    private readonly assignmentService: AssignmentService,
    private readonly sessionResultService: SessionResultService,
    private readonly auditService: AuditService,
    private readonly scheduleService: ScheduleService,
  ) {}

  getPatients(staffId: string, hospitalId: string) {
    return this.patientHospitalService.find(
      {
        staffId: new mongoose.Types.ObjectId(staffId),
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
      },
      ['patientId'],
    );
  }

  getStaffPatient(linkId: string, staffId: string) {
    return this.patientHospitalService.findOne(
      {
        _id: new mongoose.Types.ObjectId(linkId),
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      ['patientId'],
    );
  }

  async getAssignmentsForPatient(linkId: string, staffId: string) {
    const link = await this.patientHospitalService.findOne(
      {
        _id: new mongoose.Types.ObjectId(linkId),
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      [],
    );
    if (!link) throw new NotFoundException('Patient not found');
    return this.assignmentService.findByPatient(link.patientId.toString());
  }

  async getAssignmentById(id: string, staffId: string) {
    const assignment = await this.assignmentService.findById(id);

    if (!assignment) throw new NotFoundException('Invalid assignment id');

    const patientId = new mongoose.Types.ObjectId(assignment.patientId);

    const link = await this.patientHospitalService.findOne(
      {
        patientId,
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      [],
    );

    if (!link) throw new ForbiddenException('Access denied');

    return assignment;
  }

  async getSessionResults(assignmentId: string, staffId: string) {
    const assignment = await this.assignmentService.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');

    const link = await this.patientHospitalService.findOne(
      {
        patientId: new mongoose.Types.ObjectId(assignment.patientId),
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      ['patientId'],
    );
    if (!link) throw new ForbiddenException('Access denied');

    if (!link.verified) throw new ForbiddenException('Verify patient firs');

    return this.sessionResultService
      .findByAssignment(assignmentId)
      .populate('patientId');
  }

  async createAssignment(
    dto: CreateAssignmentDto,
    hospitalId: string,
    assignedBy: string,
  ) {
    const patientId = new mongoose.Types.ObjectId(dto.patientId);
    const staffId = new mongoose.Types.ObjectId(assignedBy);

    const link = await this.patientHospitalService.findOne(
      {
        patientId,
        staffId,
      },
      [],
    );

    if (!link) throw new ForbiddenException('Access denied');

    const staff = await this.userService
      .findById(assignedBy)
      .select('name role customId');

    if (!staff) throw new ForbiddenException('Account deleted');

    const patient = await this.userService
      .findById(dto.patientId)
      .select('name role customId');

    if (!patient) throw new NotFoundException('Patient not found');

    const assignment = await this.assignmentService.create({
      ...dto,
      hospitalId,
      assignedBy,
    });

    const actor = {
      userId: staff._id.toString(),
      name: staff.name,
      role: staff.role,
      customId: staff.customId,
    };

    const affected = [
      {
        userId: patient._id.toString(),
        name: patient.name,
        role: patient.role,
        customId: patient.customId,
      },
    ];

    this.auditService.record({
      action: AuditAction.ASSIGNMENT_CREATED,
      actor,
      affected,
    });

    return assignment;
  }

  async updateAssignmentById(
    id: string,
    staffId: string,
    dto: UpdateAssignmentDto | { isDeleted: true },
  ) {
    const assignment = await this.getAssignmentById(id, staffId);

    const staff = await this.userService
      .findById(staffId)
      .select('name role customId');

    if (!staff) throw new ForbiddenException('Account deleted');

    const patient = await this.userService
      .findById(assignment.patientId.toString())
      .select('name role customId');

    if (!patient) throw new NotFoundException('Patient not found');

    Object.assign(assignment, dto);
    const updatedAssignment = await assignment.save();

    const actor = {
      userId: staff._id.toString(),
      name: staff.name,
      role: staff.role,
      customId: staff.customId,
    };

    const affected = [
      {
        userId: patient._id.toString(),
        name: patient.name,
        role: patient.role,
        customId: patient.customId,
      },
    ];

    const isDelete = 'isDeleted' in dto && dto.isDeleted;

    this.auditService.record({
      action: isDelete
        ? AuditAction.ASSIGNMENT_DELETED
        : AuditAction.ASSIGNMENT_UPDATED,
      actor,
      affected,
    });

    return updatedAssignment;
  }

  async updateAssignment(
    id: string,
    staffId: string,
    dto: UpdateAssignmentDto,
  ) {
    return this.updateAssignmentById(id, staffId, dto);
  }

  async deleteAssignment(id: string, staffId: string) {
    return this.updateAssignmentById(id, staffId, { isDeleted: true });
  }

  async getSchedules(assignmentId: string, staffId: string) {
    await this.getAssignmentById(assignmentId, staffId);
    return this.scheduleService.findByAssignment(assignmentId);
  }

  async createSchedules(
    assignmentId: string,
    staffId: string,
    dto: CreateSchedulesDto,
  ) {
    const assignment = await this.getAssignmentById(assignmentId, staffId);
    const entries = dto.entries;

    const staff = await this.userService
      .findById(staffId)
      .select('name role customId');

    if (!staff) throw new ForbiddenException('Account deleted');

    const patient = await this.userService
      .findById(assignment.patientId.toString())
      .select('name role customId');

    if (!patient) throw new NotFoundException('Patient not found');

    const result = await this.scheduleService.createMany({
      assignmentId,
      patientId: assignment.patientId.toString(),
      hospitalId: assignment.hospitalId.toString(),
      entries,
    });

    if (result.created.length > 0) {
      this.auditService.record({
        action: AuditAction.SCHEDULE_UPDATED,
        actor: {
          userId: staff._id.toString(),
          name: staff.name,
          role: staff.role,
          customId: staff.customId,
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

    return result;
  }

  async updateSchedule(
    scheduleId: string,
    staffId: string,
    dto: UpdateScheduleDto,
  ) {
    const schedule = await this.scheduleService.findById(scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');

    const link = await this.patientHospitalService.findOne(
      {
        patientId: new mongoose.Types.ObjectId(schedule.patientId.toString()),
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      [],
    );

    if (!link) throw new ForbiddenException('Access denied');

    const updatedSchedule = await this.scheduleService.update(
      scheduleId,
      schedule.hospitalId.toString(),
      dto,
    );

    const staff = await this.userService
      .findById(staffId)
      .select('name role customId');
    const patient = await this.userService
      .findById(schedule.patientId.toString())
      .select('name role customId');

    if (staff && patient) {
      this.auditService.record({
        action: AuditAction.SCHEDULE_UPDATED,
        actor: {
          userId: staff._id.toString(),
          name: staff.name,
          role: staff.role,
          customId: staff.customId,
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

    return updatedSchedule;
  }

  async deleteSchedule(scheduleId: string, staffId: string) {
    const schedule = await this.scheduleService.findById(scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');

    const link = await this.patientHospitalService.findOne(
      {
        patientId: new mongoose.Types.ObjectId(schedule.patientId.toString()),
        staffId: new mongoose.Types.ObjectId(staffId),
      },
      [],
    );

    if (!link) throw new ForbiddenException('Access denied');

    const deletedSchedule = await this.scheduleService.delete(
      scheduleId,
      schedule.hospitalId.toString(),
    );

    const staff = await this.userService
      .findById(staffId)
      .select('name role customId');
    const patient = await this.userService
      .findById(schedule.patientId.toString())
      .select('name role customId');

    if (staff && patient) {
      this.auditService.record({
        action: AuditAction.SCHEDULE_UPDATED,
        actor: {
          userId: staff._id.toString(),
          name: staff.name,
          role: staff.role,
          customId: staff.customId,
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

    return deletedSchedule;
  }
}
