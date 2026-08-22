import express from 'express';
import {
  getServiceReport,
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getEmployeePerformance,
  getAppointmentReport,
  getVehicleReport,
  getDashboardReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('administrator', 'manager'), getDashboardReport);
router.get('/service', authorize('administrator', 'manager'), getServiceReport);
router.get('/services', authorize('administrator', 'manager'), getServiceReport);
router.get('/workshop', authorize('administrator', 'manager'), getServiceReport);
router.get('/sales', authorize('administrator', 'manager'), getSalesReport);
router.get('/inventory', authorize('administrator', 'manager'), getInventoryReport);
router.get('/customers', authorize('administrator', 'manager'), getCustomerReport);
router.get('/employees', authorize('administrator', 'manager'), getEmployeePerformance);
router.get('/appointments', authorize('administrator', 'manager'), getAppointmentReport);
router.get('/vehicles', authorize('administrator', 'manager'), getVehicleReport);

export default router;
