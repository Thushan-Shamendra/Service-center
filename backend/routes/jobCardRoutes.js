import express from 'express';
import {
  getJobCards,
  getJobCardById,
  createJobCard,
  updateJobCardStatus,
  updateInspection,
  addParts,
  addTimeLog,
  addEvidence,
  updateRoadTest,
  updateFinalInspection,
  assignTechnician,
  updateJobCard,
  getJobCardTimeline,
} from '../controllers/jobCardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getJobCards)
  .post(authorize('administrator', 'manager'), createJobCard);

router
  .route('/:id')
  .get(getJobCardById)
  .put(authorize('administrator', 'manager', 'employee'), updateJobCard);

router.put('/:id/status', authorize('administrator', 'manager', 'employee'), updateJobCardStatus);
router.put('/:id/inspection', authorize('administrator', 'manager', 'employee'), updateInspection);
router.put('/:id/parts', authorize('administrator', 'manager', 'employee'), addParts);
router.put('/:id/time-log', authorize('administrator', 'manager', 'employee'), addTimeLog);
router.put('/:id/evidence', authorize('administrator', 'manager', 'employee'), addEvidence);
router.put('/:id/road-test', authorize('administrator', 'manager', 'employee'), updateRoadTest);
router.put('/:id/final-inspection', authorize('administrator', 'manager', 'employee'), updateFinalInspection);
router.put('/:id/assign-technician', authorize('administrator', 'manager'), assignTechnician);
router.get('/:id/timeline', getJobCardTimeline);

export default router;
