import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestLog, RequestLogSchema } from './request-log.schema';
import { RequestLogService } from './request-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  providers: [RequestLogService],
  exports: [RequestLogService],
})
export class RequestLogModule {}
