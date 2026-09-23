import { Injectable } from '@nestjs/common';
import {
  type AssignmentStatus,
  CreateAssignmentInternal,
} from './dto/create-assignment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Assignment } from './assignment.schema';
import { Model } from 'mongoose';
import { ExerciseDocument } from 'src/exercise/exercise.schema';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<Assignment>,
  ) {}

  create(createAssignmentDto: CreateAssignmentInternal) {
    return this.assignmentModel.create({
      ...createAssignmentDto,
      status: 'active',
    });
  }

  isRealValue(val: unknown): val is string {
    return Boolean(val) && val !== 'undefined' && val !== 'null';
  }

  async findByPatient(
    patientId: string,
    hospitalId?: string,
    status?: AssignmentStatus,
  ) {
    const filter = {
      patientId,
      isDeleted: false,
      ...(this.isRealValue(status) && { status }),
      ...(this.isRealValue(hospitalId) && { hospitalId }),
    };

    const assignments = await this.assignmentModel
      .find(filter)
      .populate('exerciseId')
      .populate('assignedBy')
      .populate('hospitalId');

    return assignments;
  }

  findByHospital(hospitalId: string, patientId?: string) {
    return this.assignmentModel
      .find({
        hospitalId,
        isDeleted: false,
        ...(this.isRealValue(patientId) && { patientId }),
      })
      .populate('exerciseId')
      .populate('assignedBy');
  }

  findById(id: string) {
    return this.assignmentModel
      .findOne({ _id: id, isDeleted: false })
      .populate<{ exerciseId: ExerciseDocument }>('exerciseId');
  }
}
