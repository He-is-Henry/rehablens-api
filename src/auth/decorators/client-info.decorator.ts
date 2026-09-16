import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { extractClientData } from 'src/common/utils/extract-client-data';

export interface ISchemaClientData {
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

export const ClientData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ISchemaClientData =>
    extractClientData(ctx.switchToHttp().getRequest<Request>()),
);
