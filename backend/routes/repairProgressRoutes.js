import express from 'express';
import {
  getRepairProgress,
  updateRepairStatus,
  addInspectionData,
  addWorkPerformed,
  requestParts,
  updateProgress,
  getStatusSpecificData
} from '../controllers/repairProgressController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/:jobCardId')
  .get(getRepairProgress);

router.route('/:jobCardId/status')
  .put(authorize('administrator', 'manager', 'employee'), updateRepairStatus);

router.route('/:jobCardId/inspection')
  .post(authorize('administrator', 'manager', 'employee'), addInspectionData);

router.route('/:jobCardId/work-performed')
  .post(authorize('administrator', 'manager', 'employee'), addWorkPerformed);

router.route('/:jobCardId/parts-request')
  .post(authorize('administrator', 'manager', 'employee'), requestParts);

router.route('/:jobCardId/progress')
  .put(authorize('administrator', 'manager', 'employee'), updateProgress);

router.route('/:jobCardId/status-data')
  .get(getStatusSpecificData);

export default router;