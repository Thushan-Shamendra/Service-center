import express from 'express';
import {
  getTimeLogs,
  getTimeLogById,
  createTimeLog,
  updateTimeLog,
  getDailyTimeSummary,
} from '../controllers/timeTrackingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTimeLogs)
  .post(createTimeLog);

router.get('/daily-summary', getDailyTimeSummary);

router
  .route('/:id')
  .get(getTimeLogById)
  .put(updateTimeLog);

export default router;