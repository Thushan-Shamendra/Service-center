import express from 'express';
import {
  getAdminSummary,
  getManagerSummary,
  getEmployeeSummary,
  getCustomerSummary,
  getChartData,
  getWorkshopBays,
  getTodaysAppointments,
  getRecentJobCards,
  getManagerAlerts,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('administrator'), getAdminSummary);
router.get('/manager', authorize('manager', 'administrator'), getManagerSummary);
router.get('/manager/workshop-bays', authorize('manager', 'administrator'), getWorkshopBays);
router.get('/manager/todays-appointments', authorize('manager', 'administrator'), getTodaysAppointments);
router.get('/manager/recent-job-cards', authorize('manager', 'administrator'), getRecentJobCards);
router.get('/manager/alerts', authorize('manager', 'administrator'), getManagerAlerts);
router.get('/employee', authorize('employee'), getEmployeeSummary);
router.get('/customer', authorize('customer'), getCustomerSummary);
router.get('/charts/:type', getChartData);

export default router;
