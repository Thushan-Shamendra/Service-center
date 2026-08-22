import express from 'express';
import {
  getServiceBays,
  getServiceBayById,
  createServiceBay,
  updateServiceBay,
  deleteServiceBay,
  updateServiceBayStatus,
  initializeServiceBays,
} from '../controllers/serviceBayController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getServiceBays)
  .post(authorize('administrator', 'manager'), createServiceBay);

router.post('/initialize', authorize('administrator'), initializeServiceBays);

router
  .route('/:id')
  .get(getServiceBayById)
  .put(authorize('administrator', 'manager'), updateServiceBay)
  .delete(authorize('administrator'), deleteServiceBay);

router.put('/:id/status', authorize('administrator', 'manager'), updateServiceBayStatus);

export default router;
