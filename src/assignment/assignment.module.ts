import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Assignment.name,
        schema: AssignmentSchema,
      },
    ]),
  ],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
