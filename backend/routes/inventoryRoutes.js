import express from 'express';
import {
  getInventorySummary,
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem,
  getMovementHistory,
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/summary').get(getInventorySummary);
router.route('/movements').get(getMovementHistory);
router.route('/movement-history').get(getMovementHistory);
router.route('/').get(getInventory).post(authorize('administrator', 'manager'), createInventoryItem);

router
  .route('/:id')
  .get(getInventoryById)
  .put(authorize('administrator', 'manager'), updateInventoryItem)
  .delete(authorize('administrator', 'manager'), deleteInventoryItem);

router.post('/:id/adjust', authorize('administrator', 'manager'), adjustStock);

export default router;
