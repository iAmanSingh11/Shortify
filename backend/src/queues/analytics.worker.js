import { Worker } from 'bullmq';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { bullConnection, QUEUE_NAMES } from './queue.config.js';
import { resolveGeoFromIp } from '../services/geo.service.js';
import Click from '../models/Click.js';
import Url from '../models/Url.js';
import { logger } from '../config/logger.js';
import { connectDB } from '../config/db.js';

const hashVisitor = (ip, userAgent) =>
  crypto.createHash('sha256').update(`${ip}::${userAgent}`).digest('hex');

// Can run with the API or as a separate worker for better scalability.
const processClickJob = async (job) => {
  const { shortCode, urlId, ip, userAgent, referrer } = job.data;

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const [geo] = await Promise.all([resolveGeoFromIp(ip)]);

  const device =
    uaResult.device.type === 'mobile'
      ? 'Mobile'
      : uaResult.device.type === 'tablet'
      ? 'Tablet'
      : 'Desktop';

  const visitorHash = hashVisitor(ip, userAgent);
  const hasVisitedBefore = await Click.exists({ url: urlId, visitorHash });

  const clickDoc = await Click.create({
    url: urlId,
    shortCode,
    ip,
    country: geo.country,
    countryCode: geo.countryCode,
    city: geo.city,
    browser: uaResult.browser.name || 'Unknown',
    os: uaResult.os.name || 'Unknown',
    device,
    referrer: referrer && referrer !== '' ? referrer : 'Direct',
    userAgent,
    visitorHash,
    isReturningVisitor: Boolean(hasVisitedBefore),
  });

  await Url.findByIdAndUpdate(urlId, {
    $inc: { totalClicks: 1 },
    $set: { lastClickedAt: new Date() },
  });

  return clickDoc._id;
};

export const startAnalyticsWorker = () => {
  const worker = new Worker(QUEUE_NAMES.ANALYTICS, processClickJob, {
    connection: bullConnection,
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    logger.debug(`Analytics job ${job.id} completed for ${job.data.shortCode}`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err }, `Analytics job ${job?.id} failed for ${job?.data?.shortCode}`);
  });

  logger.info('Analytics worker started');
  return worker;
};

// Allow running as a standalone process: `npm run worker`
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  connectDB().then(() => {
    startAnalyticsWorker();
  });
}
