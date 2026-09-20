import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Hospital } from './hospital.schema';
import mongoose, { Model } from 'mongoose';
import { CounterService } from 'src/counter/counter.service';
import { UserRole } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { CreateStaffDto } from 'src/staff/dto/create-staff.dto';
import { UpdateStaffDto } from 'src/staff/dto/update-staff.dto';
import { UserDocument } from 'src/user/user.schema';
import { PatientHospitalService } from 'src/patient-hospital/patient-hospital.service';
import { MailService } from 'src/mail/mail.service';
import * as crypto from 'crypto';
import { PatientHospitalDocument } from 'src/patient-hospital/patient-hospital.schema';
import { AssignmentService } from 'src/assignment/assignment.service';
import { SessionResultService } from 'src/session-result/session-result.service';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { UpdateAssignmentDto } from 'src/assignment/dto/update-assignment.dto';
import { AuditService } from 'src/audit/audit.service';
import { Payload } from 'src/auth/dto/create-auth.dto';
import { AuditAction } from 'src/audit/audit-action.enum';
import { ExerciseService } from 'src/exercise/exercise.service';
import { ExerciseDocument } from 'src/exercise/exercise.schema';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    private userService: UserService,
    private counterService: CounterService,
    private patientHospitalService: PatientHospitalService,
    private readonly mailService: MailService,
    private readonly assignmentService: AssignmentService,
    private readonly exerciseService: ExerciseService,
    private readonly sessionResultService: SessionResultService,
    private readonly auditService: AuditService,
  ) {}

  async create(createHospitalDto: CreateHospitalDto) {
    const hospitalAlreadyExists = await this.detectConflict(
      createHospitalDto.email,
    );

    if (hospitalAlreadyExists)
      throw new ConflictException(`hospital email in use`);

    const { admin, hospital } = await this.initHospital(createHospitalDto);

    this.auditService.record({
      action: AuditAction.ADMIN_CREATED,
      actor: {
        userId: admin._id.toString(),
        name: admin.name,
        role: admin.role,
        customId: admin.customId,
      },
      affected: [
        {
          userId: admin._id.toString(),
          name: admin.name,
          role: admin.role,
          customId: admin.customId,
        },
      ],
      object: {
        id: hospital._id.toString(),
        name: hospital.name,
        type: 'Hospital',
      },
    });

    return { hospital, admin };
  }

  // search
  search(query: string) {
    const regex = new RegExp(query, 'i');

    return this.hospitalModel
      .find({
        $or: [{ name: regex }, { customId: regex }],
      })
      .limit(10)
      .select('name customId address');
  }

  async initHospital(createHospitalDto: CreateHospitalDto) {
    const createUserDto = createHospitalDto.admin;

    const paddedSequence = await this.counterService.createCount('hospital');
    const customId = `HOSP-${paddedSequence}`;
    createHospitalDto.createdAt = new Date();
    createHospitalDto.customId = customId;

    const hospital = await this.hospitalModel.create(createHospitalDto);
    const admin = await this.userService.create({
      ...createUserDto,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId: hospital._id.toString(),
      isPioneer: true,
      isActive: true,
    });

    return { hospital, admin };
  }

  async detectConflict(hospitalMail: string): Promise<boolean> {
    const hospitalAlreadyExists = await this.hospitalModel.exists({
      email: hospitalMail,
    });

    return hospitalAlreadyExists ? true : false;
  }

  // staff
  async getstaff(filter: { id: string; hospitalId: string | undefined }) {
    const _id = new mongoose.Types.ObjectId(filter.id);
    const hospitalId = new mongoose.Types.ObjectId(filter.hospitalId);

    if (!hospitalId)
      throw new UnauthorizedException('You must be an hospital admin');

    const staff = await this.userService.findOne({
      _id,
      hospitalId,
    });

    if (!staff)
      throw new NotFoundException("Staff doesn't exist in organization");

    return staff;
  }

  getAllStaff(hospitalId?: string) {
    if (!hospitalId)
      throw new UnauthorizedException('You must be an hospital admin');
    return this.userService.findAll({ hospitalId });
  }

  async createStaff(hospitalAdminJwt: Payload, createStaffDto: CreateStaffDto) {
    const allowedRoles = [UserRole.HOSPITAL_ADMIN, UserRole.STAFF];

    if (!allowedRoles.includes(createStaffDto.role))
      throw new BadRequestException('Please pick the right role');

    const hospitalAdmin = await this.userService
      .findById(hospitalAdminJwt.id)
      .select('name role customId hospitalId');

    if (!hospitalAdmin) throw new ForbiddenException('Account deleted');

    const hospitalId = hospitalAdmin.hospitalId?.toString();
    if (!hospitalId)
      throw new ForbiddenException('User is not associated with a hospital');

    const hospital = await this.hospitalModel
      .findById(hospitalId)
      .select('name customId address');

    if (!hospital) throw new NotFoundException('Invalid hospital');

    const password: string = crypto.randomBytes(8).toString('hex');

    const user = await this.userService.create({
      ...createStaffDto,
      password,
      hospitalId,
      mustChangePassword: true,
    });

    try {
      await this.mailService.sendEmail(
        createStaffDto.email,
        'Welcome to RehabLens',
        this.buildWelcomeMail(createStaffDto.name, password, hospital),
      );
    } catch (error) {
      // Log dispatch error without interrupting user creation
      console.error(`Failed to send welcome mail to ${user.email}:`, error);
    }

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
    };

    const affected = [
      {
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
        customId: user.customId,
      },
    ];

    this.auditService.record({
      action: AuditAction.ACCOUNT_CREATED,
      actor,
      affected,
    });

    return user;
  }

  buildWelcomeMail(name: string, password: string, hospital: Hospital) {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-bottom: 24px;">Welcome to RehabLens!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>An account has been created for you at <strong>${hospital?.name || 'your hospital'}</strong> (${hospital?.customId || ''}) on the RehabLens platform.</p>
      
      <div style="background-color: #F9FAFB; border-left: 4px solid #4F46E5; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin-top: 0; font-weight: bold; color: #111827;">Your Temporary Login Credentials:</p>
        <p style="margin-bottom: 8px;"><strong>Temporary Password:</strong> <code style="background: #E5E7EB; padding: 4px 8px; border-radius: 4px; font-size: 15px; font-family: monospace;">${password}</code></p>
        <p style="margin-bottom: 0; font-size: 13px; color: #6B7280;"><em>Note: For security reasons, you will be required to change this password immediately upon your first login.</em></p>
      </div>

      <p>Please use this temporary password along with your email address to log into your account.</p>
      <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
      <p style="font-size: 12px; color: #9CA3AF; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  `;
  }

  async updateStaff(
    filter: Partial<UserDocument>,
    updateStaffDto: UpdateStaffDto,
    adminId: string,
  ) {
    const updatedStaff = await this.userService.findOneAndUpdate(
      filter,
      updateStaffDto,
    );

    if (!updatedStaff) {
      const staff = await this.userService.findById(filter._id!.toString());

      if (staff) {
        if (staff.hospitalId?.toString() !== filter.hospitalId!.toString())
          throw new ForbiddenException('You do not have access to this user');

        if (staff._id.toString() === adminId)
          throw new BadRequestException('Visit Profile to edit your details');

        if (staff.isPioneer)
          throw new ForbiddenException(
            'You cannot perform this action on this user',
          );
      }

      throw new NotFoundException('User not found');
    }

    return updatedStaff;
  }

  searchStaff(query: string, hospitalId: string) {
    return this.userService.search(query, UserRole.STAFF, hospitalId);
  }

  // patient
  async linkPatient(
    patientId: string,
    hospitalAdminJwt: Payload,
    staffId?: string,
  ) {
    const hospitalAdmin = await this.userService
      .findById(hospitalAdminJwt.id)
      .select('name role customId hospitalId');

    if (!hospitalAdmin) throw new ForbiddenException('Account deleted');

    const hospitalId = hospitalAdmin.hospitalId?.toString();
    if (!hospitalId)
      throw new ForbiddenException('User is not associated with a hospital');

    const patient = await this.userService
      .findById(patientId)
      .select('name role customId');

    if (!patient) throw new NotFoundException('Patient not found');

    const link = await this.patientHospitalService.create({
      patientId,
      staffId,
      hospitalId,
      verified: true,
    });

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
    };

    // Notification target
    const affected = [
      {
        userId: patient._id.toString(),
        name: patient.name,
        role: patient.role,
        customId: patient.customId,
      },
    ];

    this.auditService.record({
      action: AuditAction.PATIENT_LINKED,
      actor,
      affected,
    });

    return link;
  }

  getLinkedPatients(hospitalId: string, filter: string, staffId?: string) {
    const verifiedFilter =
      filter === 'verified'
        ? { verified: true }
        : filter === 'unverified'
          ? { verified: false }
          : {};
    const searchFilter: Partial<PatientHospitalDocument> = {
      ...verifiedFilter,
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
    };

    if (staffId) searchFilter.staffId = new mongoose.Types.ObjectId(staffId);

    return this.patientHospitalService.find(searchFilter, [
      'staffId',
      'patientId',
    ]);
  }

  getLinkedPatient(linkId: string, hospitalId: string) {
    const _id = new mongoose.Types.ObjectId(linkId);
    return this.patientHospitalService.findOne(
      {
        _id,
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
      },
      ['patientId', 'staffId'],
    );
  }

  async toggleVerification(id: string, hospitalAdminJwt: Payload) {
    const hospitalAdmin = await this.userService
      .findById(hospitalAdminJwt.id)
      .select('name role customId hospitalId');

    if (!hospitalAdmin) throw new ForbiddenException('Account deleted');

    const hospitalId = hospitalAdmin.hospitalId?.toString();
    if (!hospitalId)
      throw new ForbiddenException('User is not associated with a hospital');

    const updatedLink = await this.patientHospitalService.toggleVerification(
      id,
      hospitalId,
    );

    if (!updatedLink) throw new NotFoundException('Relationship not found');

    const patient = updatedLink.patientId;

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
    };

    const affected = patient
      ? [
          {
            userId: patient._id.toString(),
            name: patient.name,
            role: patient.role,
            customId: patient.customId,
          },
        ]
      : [];

    const action = updatedLink.verified
      ? 'PATIENT_VERIFIED'
      : 'PATIENT_UNVERIFIED';

    this.auditService.record({
      action: AuditAction[action],
      actor,
      affected,
    });

    return updatedLink;
  }

  async assignStaff(linkId: string, staffId: string, hospitalAdmin: Payload) {
    const adminHospitalId = hospitalAdmin.hospitalId!;
    const hospitalAdminObj = await this.userService
      .findById(hospitalAdmin.id)
      .select('name role customId');

    if (!hospitalAdminObj) throw new ForbiddenException('Account deleted');

    const link = await this.patientHospitalService
      .findById(linkId)
      .populate<{ patientId: UserDocument }>('patientId');

    if (!link) throw new NotFoundException('Relationship not found');
    const staff = await this.userService.findById(staffId).lean();

    if (!staff) throw new NotFoundException('The assigned staff was not found');

    const canAssignLink = link.hospitalId.toString() === adminHospitalId;

    if (!canAssignLink)
      throw new ForbiddenException('You are not allowed to access this link');

    const canAssignStaff = staff.hospitalId?.toString() === adminHospitalId;

    if (!canAssignStaff)
      throw new ForbiddenException('You are not allowed to assign this staff');

    const patient = link.patientId;

    const actor = {
      userId: hospitalAdminObj._id.toString(),
      name: hospitalAdminObj.name,
      role: hospitalAdminObj.role,
      customId: hospitalAdminObj.customId,
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
      actor,
      action: AuditAction.STAFF_ASSIGNED,
      affected,
      outcome: 'success',
    });

    return this.patientHospitalService.assignStaff(linkId, staffId);
  }

  searchPatients(query: string) {
    return this.userService.search(query, UserRole.PATIENT);
  }

  async createAssignment(
    dto: CreateAssignmentDto,
    hospitalId: string,
    assignedBy: string,
  ) {
    const hospitalAdmin = await this.userService
      .findOne({
        _id: assignedBy,
        hospitalId,
      })
      .select('name role customId');

    const patient = await this.userService
      .findById(dto.patientId)
      .select('name role customId');

    const exercise = await this.exerciseService.findById(dto.exerciseId);

    if (!hospitalAdmin)
      throw new ForbiddenException('Your account has been deleted!');

    if (!patient) throw new BadRequestException('Patient does not exist');

    if (!exercise)
      throw new NotFoundException('The specified exercise does not exist');

    const link = await this.patientHospitalService.findOne(
      {
        patientId: new mongoose.Types.ObjectId(dto.patientId),
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        verified: true,
      },
      [],
    );

    if (!link)
      throw new ForbiddenException(
        'Patient is not linked or verified for this hospital',
      );

    const assignment = await this.assignmentService.create({
      ...dto,
      hospitalId,
      assignedBy,
    });

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
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
      object: {
        id: assignment._id.toString(),
        name: exercise.name,
        type: 'Exercise',
      },
    });

    return assignment;
  }

  async getAssignments(hospitalId: string, patientId?: string) {
    return this.assignmentService.findByHospital(hospitalId, patientId);
  }

  async getAssignmentById(id: string, hospitalId: string) {
    const assignment = await this.assignmentService.findById(id);

    if (!assignment) throw new NotFoundException('Assignment not found');

    if (assignment.hospitalId.toString() !== hospitalId) {
      throw new ForbiddenException('Access denied');
    }
    return assignment;
  }

  async updateAssignmentById(
    id: string,
    hospitalId: string,
    dto: UpdateAssignmentDto | { isDeleted: true },
  ) {
    const assignment = await this.getAssignmentById(id, hospitalId);

    const patient = await this.userService
      .findById(assignment.patientId.toString())
      .select('name role customId');

    if (!patient)
      throw new NotFoundException('The selected patient does not exist');

    Object.assign(assignment, dto);
    await assignment.save();
    const updatedAssignment = await assignment.populate<{
      exerciseId: ExerciseDocument;
    }>('exerciseId');
    return { assignment: updatedAssignment, patient };
  }

  async updateAssignment(
    id: string,
    hospitalAdminJwt: Payload,
    dto: UpdateAssignmentDto,
  ) {
    const hospitalAdmin = await this.userService
      .findById(hospitalAdminJwt.id)
      .select('name role customId');

    if (!hospitalAdmin)
      throw new ForbiddenException('You account has been deleted');

    const hospitalId = hospitalAdmin.hospitalId!.toString();

    const { assignment, patient } = await this.updateAssignmentById(
      id,
      hospitalId,
      dto,
    );

    const exercise = assignment.exerciseId;

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
    };

    const affected = [
      {
        userId: patient._id.toString(),
        name: patient.name,
        role: patient.role,
        customId: patient.customId,
      },
    ];

    const object = {
      id: assignment._id.toString(),
      name: exercise.name,
      type: 'Exercise',
    };

    this.auditService.record({
      action: AuditAction.ASSIGNMENT_UPDATED,
      actor,
      affected,
      object,
    });
  }

  async deleteAssignment(id: string, hospitalAdminJwt: Payload) {
    const hospitalAdmin = await this.userService
      .findById(hospitalAdminJwt.id)
      .select('name role customId');

    console.log(hospitalAdminJwt);

    if (!hospitalAdmin)
      throw new ForbiddenException('You account has been deleted');

    const hospitalId = hospitalAdminJwt.hospitalId!.toString();

    const { assignment, patient } = await this.updateAssignmentById(
      id,
      hospitalId,
      { isDeleted: true },
    );

    const exercise = assignment.exerciseId;

    const actor = {
      userId: hospitalAdmin._id.toString(),
      name: hospitalAdmin.name,
      role: hospitalAdmin.role,
      customId: hospitalAdmin.customId,
    };

    const affected = [
      {
        userId: patient._id.toString(),
        name: patient.name,
        role: patient.role,
        customId: patient.customId,
      },
    ];

    const object = {
      id: assignment._id.toString(),
      name: exercise.name,
      type: 'Exercise',
    };

    this.auditService.record({
      action: AuditAction.ASSIGNMENT_DELETED,
      actor,
      affected,
      object,
    });
  }

  async getSessionResults(assignmentId: string, hospitalId: string) {
    const assignment = await this.getAssignmentById(assignmentId, hospitalId);

    if (!assignment) throw new ForbiddenException('Access denied');

    return this.sessionResultService
      .findByAssignment(assignmentId)
      .populate('patientId');
  }

  findAll() {
    return this.hospitalModel.find();
  }

  findOne(id: string | undefined) {
    if (!id) throw new BadRequestException('Id is required');
    return this.hospitalModel.findById(id);
  }

  existsById(id: string) {
    return this.hospitalModel.exists({
      _id: id,
    });
  }

  update(id: string | undefined, updateHospitalDto: UpdateHospitalDto) {
    if (!id) throw new BadRequestException('Id is required');

    return this.hospitalModel.findByIdAndUpdate(id, updateHospitalDto, {
      returnDocument: 'after',
    });
  }

  remove(id: string) {
    return this.hospitalModel.findByIdAndDelete(id);
  }
}
