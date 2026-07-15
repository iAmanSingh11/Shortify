import { Router } from 'express';
import { getUrlAnalytics, getDashboardOverview, getTopLinks } from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/top-links', getTopLinks);
router.get('/:id', getUrlAnalytics);

export default router;
