import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';

export interface ISchemaClientData {
  ipAddress: string;
  deviceInfo: string;
  location: string;
}

// Helper: Convert "NG" -> "Nigeria" using Node's native Intl API
const getFullCountryName = (countryCode: string): string => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

// Helper: Parse custom RehabLens header, standard UA, or API tool
const parseDeviceInfo = (userAgent: string): string => {
  if (!userAgent) return 'Mobile App';

  // 1. Check for custom RehabLens format: "RehabLens/1.0 (iPhone 15 Pro; iOS 17.4)"
  const customMatch = userAgent.match(/\(([^)]+)\)/);
  if (customMatch && customMatch[1]) {
    return customMatch[1]; // Returns "iPhone 15 Pro; iOS 17.4"
  }

  // 2. Developer API Tools
  const uaLower = userAgent.toLowerCase();
  if (uaLower.includes('thunder-client')) return 'Thunder Client API Tool';
  if (uaLower.includes('postman')) return 'Postman API Tool';

  // 3. Fallback to standard web browser parsing
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();
  const osName = uaResult.os.name;
  const browserName = uaResult.browser.name;

  if (osName || browserName) {
    return `${osName || 'Unknown OS'} / ${browserName || 'Unknown Browser'}`;
  }

  return 'Mobile App';
};

export const ClientData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ISchemaClientData => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // 1. Resolve client IP address safely
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

    const ipAddress =
      (rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '')).trim() ||
      '127.0.0.1';

    // 2. Resolve device information
    const userAgent = request.headers['user-agent'] || '';
    const deviceInfo = parseDeviceInfo(userAgent);

    // 3. Resolve location (with 192.168 fix & full country names)
    let location = 'Unknown Location';

    const isPrivateOrLocal =
      ipAddress === '127.0.0.1' ||
      ipAddress === 'localhost' ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('192.168.') || // Added missing Wi-Fi range
      ipAddress.startsWith('172.');

    if (ipAddress && !isPrivateOrLocal) {
      try {
        const geo = geoip.lookup(ipAddress);
        if (geo && geo.country) {
          const country = getFullCountryName(geo.country);
          location = geo.city ? `${geo.city}, ${country}` : country;
        }
      } catch {
        location = 'Unknown Location';
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
