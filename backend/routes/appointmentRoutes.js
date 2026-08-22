import express from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  getAppointmentById,
  deleteAppointment,
  getAvailableTimeSlots,
  getAvailableTechnicians,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/available-slots', getAvailableTimeSlots);
router.get('/available-technicians', getAvailableTechnicians);

router.route('/').get(getAppointments).post(createAppointment);

router
  .route('/:id')
  .get(getAppointmentById)
  .put(authorize('administrator', 'manager', 'customer'), updateAppointment)
  .delete(authorize('administrator', 'manager'), deleteAppointment);

router
  .route('/:id/status')
  .put(authorize('administrator', 'manager'), updateAppointmentStatus);

export default router;
