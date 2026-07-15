import mongoose from 'mongoose';
import Url from '../models/Url.js';
import Click from '../models/Click.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const ownedUrlOrThrow = async (id, userId) => {
  const url = await Url.findOne({ _id: id, user: userId }).lean();
  if (!url) throw new ApiError(404, 'Short URL not found');
  return url;
};

// GET /api/analytics/:id?range=7d|30d|90d|all
export const getUrlAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { range = '30d' } = req.query;

  const url = await ownedUrlOrThrow(id, req.user.id);
  const urlObjectId = new mongoose.Types.ObjectId(url._id);

  const days = { '7d': 7, '30d': 30, '90d': 90, all: null }[range] ?? 30;
  const dateFilter = days ? { createdAt: { $gte: new Date(Date.now() - days * 86400000) } } : {};
  const baseMatch = { url: urlObjectId, ...dateFilter };

  const [clicksOverTime, byBrowser, byOs, byDevice, byCountry, byReferrer, byHour, visitorStats, totalInRange] = await Promise.all([
    Click.aggregate([
      { $match: baseMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Click.aggregate([{ $match: baseMatch }, { $group: { _id: '$browser', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Click.aggregate([{ $match: baseMatch }, { $group: { _id: '$os', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Click.aggregate([{ $match: baseMatch }, { $group: { _id: '$device', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Click.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Click.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    // Hourly trend
    Click.aggregate([
      { $match: baseMatch },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Returning visitor insight
    Click.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          returningClicks: { $sum: { $cond: ['$isReturningVisitor', 1, 0] } },
          uniqueVisitors: { $addToSet: '$visitorHash' },
        },
      },
      { $project: { totalClicks: 1, returningClicks: 1, uniqueVisitorCount: { $size: '$uniqueVisitors' } } },
    ]),
    Click.countDocuments(baseMatch),
  ]);

  // Fill in all 24 hours (even ones with zero clicks) so the chart is continuous
  const hourlyMap = new Map(byHour.map((h) => [h._id, h.count]));
  const hourlyTrend = Array.from({ length: 24 }, (_, hour) => ({ hour, clicks: hourlyMap.get(hour) || 0 }));

  const visitors = visitorStats[0] || { totalClicks: 0, returningClicks: 0, uniqueVisitorCount: 0 };

  sendSuccess(res, 200, 'Analytics fetched successfully', {
    url: { id: url._id, title: url.title, shortCode: url.shortCode, totalClicks: url.totalClicks },
    totalClicksInRange: totalInRange,
    clicksOverTime: clicksOverTime.map((c) => ({ date: c._id, clicks: c.count })),
    hourlyTrend,
    byBrowser: byBrowser.map((c) => ({ name: c._id || 'Unknown', count: c.count })),
    byOs: byOs.map((c) => ({ name: c._id || 'Unknown', count: c.count })),
    byDevice: byDevice.map((c) => ({ name: c._id || 'Unknown', count: c.count })),
    byCountry: byCountry.map((c) => ({ name: c._id || 'Unknown', count: c.count })),
    byReferrer: byReferrer.map((c) => ({ name: c._id || 'Direct', count: c.count })),
    visitorInsights: {
      uniqueVisitors: visitors.uniqueVisitorCount,
      returningClicks: visitors.returningClicks,
      newClicks: visitors.totalClicks - visitors.returningClicks,
      returningRate: visitors.totalClicks ? Math.round((visitors.returningClicks / visitors.totalClicks) * 100) : 0,
    },
  });
});

// GET /api/analytics/top-links?limit=10 — user's best performing links by total clicks
export const getTopLinks = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const links = await Url.find({ user: req.user.id })
    .sort({ totalClicks: -1 })
    .limit(limit)
    .select('title shortCode originalUrl totalClicks createdAt lastClickedAt')
    .lean();

  sendSuccess(res, 200, 'Top links fetched', {
    links: links.map((l) => ({ ...l, shortUrl: `${env.baseUrl}/${l.shortCode}` })),
  });
});

// GET /api/analytics/overview — aggregate stats across all of the user's links, for the dashboard
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const [urlStats, recentClicks, topLinks] = await Promise.all([
    Url.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalClicks: { $sum: '$totalClicks' },
          activeLinks: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
    ]),
    Click.aggregate([
      { $lookup: { from: 'urls', localField: 'url', foreignField: '_id', as: 'urlInfo' } },
      { $unwind: '$urlInfo' },
      { $match: { 'urlInfo.user': userId, createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Url.find({ user: userId }).sort({ totalClicks: -1 }).limit(5).select('title shortCode totalClicks originalUrl').lean(),
  ]);

  const stats = urlStats[0] || { totalLinks: 0, totalClicks: 0, activeLinks: 0 };

  sendSuccess(res, 200, 'Dashboard overview fetched', {
    ...stats,
    clicksLast14Days: recentClicks.map((c) => ({ date: c._id, clicks: c.count })),
    topLinks,
  });
});
