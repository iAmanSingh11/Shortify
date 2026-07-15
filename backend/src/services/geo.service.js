import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const UNKNOWN = { country: 'Unknown', countryCode: '', city: 'Unknown' };

// Fetches geolocation data for an IP address and handles lookup failures gracefully.
export const resolveGeoFromIp = async (ip) => {
  try {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return UNKNOWN;
    }

    const cleanIp = ip.replace('::ffff:', '');
    const response = await fetch(`${env.geoApiUrl}/${cleanIp}`);
    if (!response.ok) return UNKNOWN;

    const data = await response.json();
    if (!data.success) return UNKNOWN;

    return {
      country: data.country || 'Unknown',
      countryCode: data.country_code || '',
      city: data.city || 'Unknown',
    };
  } catch (err) {
    logger.warn({ err }, 'Geo lookup failed');
    return UNKNOWN;
  }
};
