import express from 'express';
import { getAnalyticsData } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, getAnalyticsData);

export default router;
