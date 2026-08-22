import express from 'express';
import {
  getRoadTests,
  getRoadTestById,
  createRoadTest,
  updateRoadTest,
  getJobsReadyForRoadTest,
} from '../controllers/roadTestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getRoadTests)
  .post(createRoadTest);

router.get('/ready-for-test', getJobsReadyForRoadTest);

router
  .route('/:id')
  .get(getRoadTestById)
  .put(updateRoadTest);

export default router;