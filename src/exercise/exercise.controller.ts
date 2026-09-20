import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  findAll() {
    return this.exerciseService.findAll();
  }

  @Get('/deleted')
  findAllDeleted() {
    return this.exerciseService.findAllDeleted();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/restore')
  restoreDeleted(@Param('id') id: string) {
    return this.exerciseService.restoreDeleted(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.exerciseService.delete(id);
  }
}
