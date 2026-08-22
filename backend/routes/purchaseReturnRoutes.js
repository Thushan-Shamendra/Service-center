import express from 'express';
import {
  getPurchaseReturns,
  getPurchaseReturnById,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  approvePurchaseReturn,
  rejectPurchaseReturn,
  getPurchaseReturnSummary,
} from '../controllers/purchaseReturnController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getPurchaseReturnSummary);

router
  .route('/')
  .get(getPurchaseReturns)
  .post(createPurchaseReturn);

router
  .route('/:id')
  .get(getPurchaseReturnById)
  .put(updatePurchaseReturn)
  .delete(deletePurchaseReturn);

router.patch('/:id/approve', authorize('administrator', 'manager'), approvePurchaseReturn);
router.patch('/:id/reject', authorize('administrator', 'manager'), rejectPurchaseReturn);

export default router;