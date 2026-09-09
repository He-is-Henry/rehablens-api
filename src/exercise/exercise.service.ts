import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Exercise } from './exercise.schema';
import { Model } from 'mongoose';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<Exercise>,
  ) {}
  findAll() {
    return this.exerciseModel.find({ isDeleted: false });
  }

  findById(id: string) {
    return this.exerciseModel.findOne({ _id: id, isDeleted: false });
  }
}
