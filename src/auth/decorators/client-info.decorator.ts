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

    // 1. Resolve client IP address safely by prioritizing proxy headers
    const xForwardedFor = request.headers['x-forwarded-for'];
    let rawIp = '';

    if (xForwardedFor) {
      // x-forwarded-for can be a string or an array. We stringify and grab the very first IP.
      const forwardedString = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      rawIp = forwardedString.split(',')[0].trim();
    } else {
      // Fallback if the request didn't pass through a proxy
      rawIp = request.ip || request.socket.remoteAddress || '';
    }

    // Format loopbacks down to clean strings
    const ipAddress = rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '');

    // 2. Resolve human-readable device info string
    const userAgent = request.headers['user-agent'] || '';

    let deviceInfo = 'Unknown Device';
    if (userAgent.toLowerCase().includes('thunder-client')) {
      deviceInfo = 'Thunder Client API Tool';
    } else {
      const parser = new UAParser(userAgent);
      const uaResult = parser.getResult();
      const osName = uaResult.os.name || 'Unknown OS';
      const browserName = uaResult.browser.name || 'Unknown Browser';
      deviceInfo = `${osName} / ${browserName}`;
    }

    // 3. Resolve location string using geoip-lite database
    let location = 'Unknown Location';

    if (
      ipAddress &&
      ipAddress !== '127.0.0.1' &&
      !ipAddress.startsWith('172.') &&
      !ipAddress.startsWith('10.')
    ) {
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        const city = geo.city ? `${geo.city}, ` : '';
        const country = geo.country || 'Unknown Country';
        location = `${city}${country}`;
      }
    } else {
      location = 'Localhost / Private Network';
    }

    return {
      ipAddress,
      deviceInfo,
      location,
    };
  },
);
