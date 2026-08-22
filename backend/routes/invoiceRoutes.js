import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getInvoices)
  .post(authorize('administrator', 'manager'), createInvoice);

router.route('/:id').get(getInvoiceById);

router.post('/:id/payments', authorize('administrator', 'manager'), recordPayment);

export default router;
