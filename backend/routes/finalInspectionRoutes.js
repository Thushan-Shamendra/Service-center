import express from 'express';
import {
  getFinalInspections,
  getFinalInspectionById,
  createFinalInspection,
  updateFinalInspection,
  submitFinalInspection,
} from '../controllers/finalInspectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getFinalInspections)
  .post(createFinalInspection);

router
  .route('/:id')
  .get(getFinalInspectionById)
  .put(updateFinalInspection);

router.put('/:id/submit', submitFinalInspection);

export default router;