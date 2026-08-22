import express from 'express';
import {
  getSparePartsRequests,
  createSparePartsRequest,
  getPartsRequestStats,
  approveSparePartsRequest,
  rejectSparePartsRequest,
  issueSpareParts,
  getSparePartsRequestById,
  getSparePartsByJobCard,
  recordPartsUsage,
  approveMultiple,
  rejectMultiple,
} from '../controllers/sparePartsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getSparePartsRequests)
  .post(createSparePartsRequest);

router.get('/stats', getPartsRequestStats);
router.get('/job-card/:jobCardId', getSparePartsByJobCard);
router.post('/approve-multiple', authorize('administrator', 'manager'), approveMultiple);
router.post('/reject-multiple', authorize('administrator', 'manager'), rejectMultiple);

router
  .route('/:id')
  .get(getSparePartsRequestById);

router.put('/:id/approve', authorize('administrator', 'manager'), approveSparePartsRequest);
router.put('/:id/reject', authorize('administrator', 'manager'), rejectSparePartsRequest);
router.put('/:id/issue', authorize('administrator', 'manager'), issueSpareParts);
router.put('/:id/record-usage', recordPartsUsage);

export default router;
