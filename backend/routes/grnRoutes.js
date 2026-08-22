import express from 'express';
import {
  getGRNs,
  getGRNById,
  createGRN,
  updateGRN,
  deleteGRN,
  getGRNSummary,
  verifyGRN,
} from '../controllers/grnController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getGRNSummary);

router
  .route('/')
  .get(getGRNs)
  .post(createGRN);

router
  .route('/:id')
  .get(getGRNById)
  .put(authorize('administrator', 'manager'), updateGRN)
  .delete(authorize('administrator'), deleteGRN);

router.patch('/:id/verify', authorize('administrator', 'manager'), verifyGRN);

export default router;
