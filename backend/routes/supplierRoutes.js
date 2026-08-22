import express from 'express';
import {
  getSupplierSummary,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  activateSupplier,
  deactivateSupplier,
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSupplierSummary);

router
  .route('/')
  .get(getSuppliers)
  .post(authorize('administrator', 'manager'), createSupplier);

router
  .route('/:id')
  .get(getSupplierById)
  .put(authorize('administrator', 'manager'), updateSupplier)
  .delete(authorize('administrator'), deleteSupplier);

router.patch('/:id/activate', authorize('administrator', 'manager'), activateSupplier);
router.patch('/:id/deactivate', authorize('administrator', 'manager'), deactivateSupplier);

export default router;
