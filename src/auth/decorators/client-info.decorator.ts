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

    // 1. Resolve client IP address safely from proxy headers
    const xForwardedFor = request.headers['x-forwarded-for'];
    let rawIp = '';

    if (xForwardedFor) {
      const forwardedString = Array.isArray(xForwardedFor)
        ? xForwardedFor.join(',')
        : xForwardedFor;
      const firstIp = forwardedString.split(',')[0];
      rawIp = firstIp ? firstIp.trim() : '';
    } else {
      rawIp = request.ip || request.socket.remoteAddress || '';
    }

    const ipAddress = rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '');

    // 2. Resolve device information smoothly
    const userAgent = request.headers['user-agent'] || '';
    let deviceInfo = 'Unknown Device';

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const osName = uaResult.os.name;
    const browserName = uaResult.browser.name;

    if (osName || browserName) {
      deviceInfo = `${osName || 'Unknown OS'} / ${browserName || 'Unknown Browser'}`;
    } else if (userAgent.toLowerCase().includes('thunder-client')) {
      deviceInfo = 'Thunder Client API Tool';
    }

    // 3. High-Resolution Online MaxMind-powered GeoIP lookup
    let location = 'Unknown Location';

    const isPrivateOrLocal =
      ipAddress === '127.0.0.1' ||
      ipAddress === 'localhost' ||
      ipAddress.startsWith('172.') ||
      ipAddress.startsWith('10.');

    if (ipAddress && !isPrivateOrLocal) {
      try {
        const geo = geoip.lookup(ipAddress);
        location = geo
          ? `${geo.city ? geo.city + ', ' : ''}${geo.country}`
          : 'Unknown Location';
      } catch (err) {
        console.log(err);
        location = 'NG';
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
