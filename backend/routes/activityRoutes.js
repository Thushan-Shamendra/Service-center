import express from 'express';
import {
  logActivity,
  getActivities,
  getAllActivities,
} from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').post(logActivity).get(getActivities);

router.get('/all', authorize('administrator', 'manager'), getAllActivities);

export default router;