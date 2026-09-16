import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';

// Helper: Convert country code ("NG") to full name ("Nigeria") natively using Intl API
const getFullCountryName = (countryCode: string): string => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

// Helper: Title-case device models dynamically (works for Tecno, Itel, Samsung, Apple, Xiaomi, etc.)
const formatDeviceName = (name: string): string => {
  if (!name) return 'Mobile Device';
  return name.trim().replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

// Helper: Parse custom mobile header, web browser UA, or API tools cleanly
const parseDeviceInfo = (userAgent: string): string => {
  if (!userAgent) return 'Unknown Device';

  // 1. Custom Mobile App header: "RehabLens/1.0 (samsung SM-A135F; ...)" or "RehabLens/1.0 (tecno CK8n; Android 14)"
  const customMatch = userAgent.match(/RehabLens\/[^\s]+\s*\(([^)]+)\)/i);
  if (customMatch && customMatch[1]) {
    const parts = customMatch[1].split(';').map((p) => p.trim());

    // Dynamically format ANY brand/model string without hardcoded rules
    const model = formatDeviceName(parts[0]);

    // Clean OS extraction (handles "Android 14", "iOS 17.4", or raw build strings)
    let osInfo = '';
    if (parts[1]) {
      const androidMatch = parts[1].match(/(?:Android\s*|:)(\d+)/i);
      const iosMatch = parts[1].match(/iOS\s*([\d.]+)/i);

      if (androidMatch) {
        osInfo = `Android ${androidMatch[1]}`;
      } else if (iosMatch) {
        osInfo = `iOS ${iosMatch[1]}`;
      } else {
        osInfo = parts[1].split(' ')[0] || '';
      }
    }

    return osInfo ? `${model} (${osInfo})` : model;
  }

  // 2. Developer API Tools
  const uaLower = userAgent.toLowerCase();
  if (uaLower.includes('thunder-client')) return 'Thunder Client API Tool';
  if (uaLower.includes('postman')) return 'Postman API Tool';
  if (uaLower.includes('insomnia')) return 'Insomnia API Tool';

  // 3. Standard Web Browser Parsing (Preserves Web app compatibility for future release)
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ' ' + result.os.version : ''}`
    : '';
  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.version ? ' ' + result.browser.version.split('.')[0] : ''}`
    : '';
  const device = result.device.model
    ? `${result.device.vendor || ''} ${result.device.model}`.trim()
    : '';

  if (browser && os) return `${browser} on ${os}`;
  if (os && device) return `${device} (${os})`;
  if (browser) return browser;
  if (os) return os;

  return 'Unknown Device';
};

export function extractClientData(request: Request) {
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
    rawIp = request.ip || request.socket?.remoteAddress || '';
  }

  const ipAddress =
    (rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^.*:/, '')).trim() ||
    '127.0.0.1';

  // 2. Resolve device information
  const userAgent = request.headers['user-agent'] || '';
  const deviceInfo = parseDeviceInfo(userAgent);

  // 3. Resolve location (with 192.168 local check, full country names & timezone city fallback)
  let location = 'Unknown Location';

  const isPrivateOrLocal =
    ipAddress === '127.0.0.1' ||
    ipAddress === 'localhost' ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('172.');

  if (ipAddress && !isPrivateOrLocal) {
    try {
      const geo = geoip.lookup(ipAddress);
      if (geo && geo.country) {
        const country = getFullCountryName(geo.country);

        let cityName = geo.city ? geo.city.trim() : '';

        // Fallback: If city is missing on mobile cellular IPs, derive city from timezone (e.g. "Africa/Lagos" -> "Lagos")
        if (!cityName && geo.timezone) {
          const tzParts = geo.timezone.split('/');
          if (tzParts.length > 1) {
            cityName = tzParts[1].replace(/_/g, ' ');
          }
        }

        location = cityName ? `${cityName}, ${country}` : country;
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
}
