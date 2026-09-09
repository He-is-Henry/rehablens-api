import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';
import { SessionResultService } from 'src/session-result/session-result.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly patientHospitalService: PatientHospitalService,
    private readonly userService: UserService,
    private readonly assignmentService: AssignmentService,
    private readonly sessionResultService: SessionResultService,
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
    console.log({ patientId, link });

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

    return this.assignmentService.create({
      ...dto,
      hospitalId,
      assignedBy,
    });
  }
}
