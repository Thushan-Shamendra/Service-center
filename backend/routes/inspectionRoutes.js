import express from 'express';
import {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  completeInspection,
  uploadInspectionMedia,
} from '../controllers/inspectionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getInspections)
  .post(createInspection);

router
  .route('/:id')
  .get(getInspectionById)
  .put(updateInspection);

router.put('/:id/complete', completeInspection);
router.post('/:id/media', upload.single('file'), uploadInspectionMedia);

export default router;