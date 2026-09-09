import { Module } from '@nestjs/common';
import { SessionResultService } from './session-result.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionResult, SessionResultSchema } from './session-result.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SessionResult.name,
        schema: SessionResultSchema,
      },
    ]),
  ],
  providers: [SessionResultService],
  exports: [SessionResultService],
})
export class SessionResultModule {}
