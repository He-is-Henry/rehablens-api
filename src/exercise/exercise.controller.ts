import { Controller, Get, Param } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.STAFF)
  @Get('')
  getAllExercises() {
    return this.exerciseService.findAll();
  }

  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.STAFF)
  @Get('/:id')
  getExercise(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }
}
