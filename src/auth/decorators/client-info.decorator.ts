import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface ISchemaClientData {
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

// interface IGeoApiResponse {
//   city?: {
//     names?: {
//       en?: string;
//     };
//   };
//   country?: {
//     names?: {
//       en?: string;
//     };
//     iso_code?: string;
//   };
// }

export const ClientData = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<ISchemaClientData> => {
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
        // Querying a high-resolution, open-source mirror of the MaxMind City GeoIP API
        const response = await fetch(`https://ipapi.co{ipAddress}/json/`);
        const geoData = (await response.json()) as Record<string, unknown>;

        if (geoData && typeof geoData === 'object' && !geoData.error) {
          const city =
            typeof geoData.city === 'string' ? `${geoData.city}, ` : '';
          const country =
            typeof geoData.country_name === 'string'
              ? geoData.country_name
              : 'Nigeria';
          location = `${city}${country}`;
        }
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
