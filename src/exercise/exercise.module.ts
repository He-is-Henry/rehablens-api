import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exercise, ExerciseSchema } from './exercise.schema';
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Exercise.name,
        schema: ExerciseSchema,
      },
    ]),
  ],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
