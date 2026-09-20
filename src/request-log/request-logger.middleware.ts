import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestLogService } from './request-log.service';
import { extractClientData } from 'src/common/utils/extract-client-data';

const SKIP = ['/health', '/favicon.ico', '/wake'];

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly requestLogService: RequestLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (SKIP.some((p) => req.originalUrl.startsWith(p))) {
      console.log(`Skipping request ${req.originalUrl}`);
      return next();
    }

    const start = Date.now();

    res.on('finish', () => {
      const user = req.user;
      const client = extractClientData(req);

      const skipLog = res.skipLog;

      if (skipLog) {
        console.log(`Skipping request logging ${req.originalUrl}`);
        return;
      }

      console.log(`Logging request ${req.originalUrl}`);

      this.requestLogService.record({
        method: req.method,
        url: req.originalUrl.split('?')[0],
        status: res.statusCode,
        duration: Date.now() - start,
        userId: user?.id,
        userRole: user?.role,
        ...client,
        createdAt: new Date(),
      });
    });

    next();
  }
}
