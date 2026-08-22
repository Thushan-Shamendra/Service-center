import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderSummary,
  receiveGoods,
  approvePurchaseOrder,
} from '../controllers/purchaseOrderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getPurchaseOrderSummary);

router
  .route('/')
  .get(getPurchaseOrders)
  .post(authorize('administrator', 'manager'), createPurchaseOrder);

router
  .route('/:id')
  .get(getPurchaseOrderById)
  .put(authorize('administrator', 'manager'), updatePurchaseOrder)
  .delete(authorize('administrator'), deletePurchaseOrder);

router.patch('/:id/cancel', authorize('administrator', 'manager'), cancelPurchaseOrder);
router.patch('/:id/approve', authorize('administrator', 'manager'), approvePurchaseOrder);
router.patch('/:id/receive', authorize('administrator', 'manager'), receiveGoods);

export default router;