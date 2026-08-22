import express from 'express';
import {
  getSupplierPayments,
  getSupplierPaymentById,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  getSupplierPaymentSummary,
} from '../controllers/supplierPaymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSupplierPaymentSummary);

router
  .route('/')
  .get(getSupplierPayments)
  .post(createSupplierPayment);

router
  .route('/:id')
  .get(getSupplierPaymentById)
  .put(updateSupplierPayment)
  .delete(deleteSupplierPayment);

export default router;