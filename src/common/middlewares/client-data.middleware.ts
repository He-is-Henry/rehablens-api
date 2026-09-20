import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { extractClientData } from '../utils/extract-client-data';

@Injectable()
export class ClientDataMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const clientData = extractClientData(req);

    this.cls.set('clientData', clientData);

    next();
  }
}
