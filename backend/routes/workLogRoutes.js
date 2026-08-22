import express from 'express';
import {
  getWorkLogs,
  getWorkLogById,
  createWorkLog,
  updateWorkLog,
} from '../controllers/workLogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getWorkLogs)
  .post(createWorkLog);

router
  .route('/:id')
  .get(getWorkLogById)
  .put(updateWorkLog);

export default router;