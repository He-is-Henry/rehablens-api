import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from './exercise.schema';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<Exercise>,
  ) {}

  findAll() {
    return this.exerciseModel.find({ isDeleted: false });
  }

  findAllDeleted() {
    return this.exerciseModel.find({ isDeleted: true });
  }

  restoreDeleted(id: string) {
    return this.exerciseModel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
      },
      { returnDocument: 'after' },
    );
  }

  async findById(id: string) {
    const exercise = await this.exerciseModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  create(dto: CreateExerciseDto) {
    return this.exerciseModel.create(dto);
  }

  async update(id: string, dto: UpdateExerciseDto) {
    const exercise = await this.findById(id);
    Object.assign(exercise, dto);
    return exercise.save();
  }

  async delete(id: string) {
    const exercise = await this.findById(id);
    exercise.isDeleted = true;
    return exercise.save();
  }
}
