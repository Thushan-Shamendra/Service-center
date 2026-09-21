import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  submitQuotation,
  approveQuotation,
  rejectQuotation,
  convertToInvoice,
  deleteQuotation,
} from '../controllers/quotationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getQuotations)
  .post(authorize('administrator', 'manager'), createQuotation);

router
  .route('/:id')
  .get(getQuotationById)
  .put(authorize('administrator', 'manager'), updateQuotation)
  .delete(authorize('administrator', 'manager'), deleteQuotation);

router.put('/:id/submit', authorize('administrator', 'manager'), submitQuotation);
router.put('/:id/approve', authorize('administrator', 'manager', 'customer'), approveQuotation);
router.put('/:id/reject', authorize('administrator', 'manager', 'customer'), rejectQuotation);
router.post('/:id/convert', authorize('administrator', 'manager'), convertToInvoice);
router.post('/:id/convert-to-invoice', authorize('administrator', 'manager'), convertToInvoice);

export default router;
