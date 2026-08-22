import express from 'express';
import {
  getPayments,
  getPaymentById,
  createPayment,
  refundPayment,
  updatePayment,
  getPaymentStats,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(authorize('administrator', 'manager'), createPayment);

router.get('/stats', authorize('administrator', 'manager'), getPaymentStats);

router
  .route('/:id')
  .get(getPaymentById)
  .put(authorize('administrator', 'manager'), updatePayment);

router.put('/:id/refund', authorize('administrator', 'manager'), refundPayment);

export default router;
