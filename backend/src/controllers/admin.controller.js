import User from '../models/User.js';
import Url from '../models/Url.js';
import Click from '../models/Click.js';
import AuditLog from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { invalidateUrlCache } from '../services/cache.service.js';
import { recordAudit } from '../services/audit.service.js';
import { env } from '../config/env.js';

const paginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// GET /api/admin/overview — platform wide stats for the admin dashboard
export const getAdminOverview = asyncHandler(async (req, res) => {
  const [userStats, urlStats, clicksToday, clicksLast7Days] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        },
      },
    ]),
    Url.aggregate([
      { $group: { _id: null, totalLinks: { $sum: 1 }, totalClicks: { $sum: '$totalClicks' } } },
    ]),
    Click.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    Click.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  sendSuccess(res, 200, 'Admin overview fetched', {
    ...(userStats[0] || { totalUsers: 0, activeUsers: 0, admins: 0 }),
    ...(urlStats[0] || { totalLinks: 0, totalClicks: 0 }),
    clicksToday,
    clicksLast7Days: clicksLast7Days.map((c) => ({ date: c._id, clicks: c.count })),
  });
});

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const { search = '', role = 'all', status = 'all' } = req.query;
  const { page, limit, skip } = paginationParams(req.query);

  const query = {};
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (role !== 'all') query.role = role;
  if (status !== 'all') query.isActive = status === 'active';

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Users fetched', { users }, { total, page, limit, totalPages: Math.ceil(total / limit) });
});

// PATCH /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (req.params.id === req.user.id && role !== 'admin') {
    throw new ApiError(400, 'You cannot demote your own account');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'admin.user.role_change',
    targetType: 'User',
    targetId: user._id,
    req,
    metadata: { newRole: role },
  });

  sendSuccess(res, 200, 'User role updated', { user: user.toSafeObject() });
});

// PATCH /api/admin/users/:id/status  { isActive }
export const setUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (req.params.id === req.user.id) throw new ApiError(400, 'You cannot deactivate your own account');

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: isActive ? 'admin.user.activate' : 'admin.user.deactivate',
    targetType: 'User',
    targetId: user._id,
    req,
  });

  sendSuccess(res, 200, `User ${isActive ? 'activated' : 'deactivated'}`, { user: user.toSafeObject() });
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, 'You cannot delete your own account');

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const userUrls = await Url.find({ user: user._id }).select('shortCode');
  await Promise.all([
    Url.deleteMany({ user: user._id }),
    Click.deleteMany({ url: { $in: userUrls.map((u) => u._id) } }),
    ...userUrls.map((u) => invalidateUrlCache(u.shortCode)),
  ]);

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'admin.user.delete',
    targetType: 'User',
    targetId: user._id,
    req,
    metadata: { deletedLinkCount: userUrls.length },
  });

  sendSuccess(res, 200, 'User and all their links deleted');
});

// GET /api/admin/links — every link across all users
export const listAllLinks = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const { page, limit, skip } = paginationParams(req.query);

  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
      { shortCode: { $regex: search, $options: 'i' } },
    ];
  }

  const [links, total] = await Promise.all([
    Url.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Url.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Links fetched', {
    links: links.map((l) => ({ ...l, shortUrl: `${env.baseUrl}/${l.shortCode}`, password: undefined })),
  }, { total, page, limit, totalPages: Math.ceil(total / limit) });
});

// DELETE /api/admin/links/:id — admin can remove any user's link
export const deleteAnyLink = asyncHandler(async (req, res) => {
  const url = await Url.findByIdAndDelete(req.params.id);
  if (!url) throw new ApiError(404, 'Link not found');

  await Promise.all([invalidateUrlCache(url.shortCode), Click.deleteMany({ url: url._id })]);

  await recordAudit({
    actor: req.user.id,
    actorEmail: req.user.email,
    action: 'admin.url.delete',
    targetType: 'Url',
    targetId: url._id,
    req,
    metadata: { shortCode: url.shortCode, owner: url.user },
  });

  sendSuccess(res, 200, 'Link deleted');
});

// GET /api/admin/audit-logs
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, status, actorEmail } = req.query;
  const { page, limit, skip } = paginationParams(req.query);

  const query = {};
  if (action) query.action = action;
  if (status) query.status = status;
  if (actorEmail) query.actorEmail = { $regex: actorEmail, $options: 'i' };

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Audit logs fetched', { logs }, { total, page, limit, totalPages: Math.ceil(total / limit) });
});
