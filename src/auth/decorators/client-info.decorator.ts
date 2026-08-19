import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface ISchemaClientData {
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

interface IGeoApiResponse {
  city?: string;
  country_name?: string;
  country?: string;
  error?: boolean;
}

export const ClientData = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<ISchemaClientData> => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // 1. Resolve client IP address safely from proxy headers
    const xForwardedFor = request.headers['x-forwarded-for'];
    let rawIp = '';

    if (xForwardedFor) {
      const forwardedString = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      rawIp = forwardedString.split(',')[0].trim();
    } else {
      rawIp = request.ip || request.socket.remoteAddress || '';
    }

    const ipAddress = rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '');

    // 2. Resolve device info natively using the user-agent string
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

    // 3. High-Resolution Location Cloud Fetch (No RAM overhead, accurate cities)
    let location = 'Unknown Location';

    const isPrivateOrLocal =
      ipAddress === '127.0.0.1' ||
      ipAddress === 'localhost' ||
      ipAddress.startsWith('172.') ||
      ipAddress.startsWith('10.');

    if (ipAddress && !isPrivateOrLocal) {
      try {
        // Query the live cloud geo-table for high-resolution country and city matching
        const response = await fetch(`https://ipapi.co{ipAddress}/json/`);
        const geoData = (await response.json()) as IGeoApiResponse;

        if (geoData && !geoData.error) {
          const city = geoData.city ? `${geoData.city}, ` : '';
          const country =
            geoData.country_name || geoData.country || 'Unknown Country';
          location = `${city}${country}`;
        } else {
          location = 'Nigeria'; // Fallback if API limits hit
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
