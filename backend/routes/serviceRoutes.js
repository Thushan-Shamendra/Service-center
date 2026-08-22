import express from 'express';
import {
  getCategories,
  createCategory,
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  toggleServiceStatus,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/categories', getCategories);
router.post('/categories', authorize('administrator'), createCategory);

router.route('/').get(getServices).post(authorize('administrator'), createService);

router.route('/:id').get(getServiceById).put(authorize('administrator'), updateService).delete(authorize('administrator'), deleteService);

router.patch('/:id/toggle-status', authorize('administrator'), toggleServiceStatus);

export default router;
