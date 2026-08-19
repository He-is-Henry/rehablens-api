import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';

export interface ISchemaClientData {
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

export const ClientData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ISchemaClientData => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // 1. Resolve client IP address
    const rawIp = request.ip || request.socket.remoteAddress || '';
    // Format IPv6 looped back standard down to clean IPv4 if testing locally
    const ipAddress = rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '');

    // 2. Resolve human-readable device info string
    const userAgent = request.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const osName = uaResult.os.name || 'Unknown OS';
    const browserName = uaResult.browser.name || 'Unknown Browser';
    const deviceInfo = `${osName} / ${browserName}`;

    // 3. Resolve location string using geoip-lite database
    let location = 'Unknown Location';

    // Local addresses will return null from lookup databases
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== 'localhost') {
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        const city = geo.city ? `${geo.city}, ` : '';
        const country = geo.country || 'Unknown Country';
        location = `${city}${country}`;
      }
    } else {
      location = 'Localhost (Development)';
    }

    return {
      ipAddress,
      deviceInfo,
      location,
    };
  },
);
