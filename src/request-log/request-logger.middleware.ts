import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestLogService } from './request-log.service';
import { extractClientData } from 'src/common/utils/extract-client-data';

const SKIP = ['/health', '/favicon.ico', '/wake'];

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly requestLogService: RequestLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`New request ${req.url}`);

    if (SKIP.some((p) => req.originalUrl.startsWith(p))) return next();

    const start = Date.now();

    res.on('finish', () => {
      // req.user is populated by now, guards have already run
      const user = req.user;
      const client = extractClientData(req);

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
