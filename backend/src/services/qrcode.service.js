import QRCode from 'qrcode';
import { logger } from '../config/logger.js';

export const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
  } catch (err) {
    logger.error({ err }, 'QR code generation failed');
    throw err;
  }
};
