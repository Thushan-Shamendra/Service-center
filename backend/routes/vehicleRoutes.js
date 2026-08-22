import express from 'express';
import { getVehicles, getVehicleById, registerVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getVehicles)
  .post(authorize('administrator', 'manager', 'customer'), registerVehicle);

router
  .route('/:id')
  .get(getVehicleById)
  .put(authorize('administrator', 'manager', 'customer'), updateVehicle)
  .delete(authorize('administrator', 'manager'), deleteVehicle);

export default router;
