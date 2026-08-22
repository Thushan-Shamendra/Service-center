import express from 'express';
import {
  getAttendance,
  recordAttendance,
  updateAttendance,
  checkIn,
  checkOut,
  getPayroll,
  getPayrollById,
  processPayroll,
  createPayroll,
  updatePayroll,
  generatePayslip,
  updatePayrollStatus,
  getHRStats,
  getPayrollSettings,
  updatePayrollSettings,
  calculatePayrollPreview,
  bulkCalculatePayroll,
  bulkProcessPayroll,
} from '../controllers/hrController.js';
import {
  getLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  updateLeaveStatus,
  getLeaveStats,
  deleteLeaveRequest,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Attendance routes
router.route('/attendance').get(getAttendance).post(authorize('administrator', 'manager'), recordAttendance);
router.put('/attendance/:id', authorize('administrator', 'manager'), updateAttendance);
router.post('/attendance/check-in', checkIn);
router.post('/attendance/check-out', checkOut);

// Payroll routes
router.get('/stats', authorize('administrator', 'manager'), getHRStats);
router.get('/payroll/settings', authorize('administrator'), getPayrollSettings);
router.put('/payroll/settings', authorize('administrator'), updatePayrollSettings);
router.post('/payroll/process', authorize('administrator'), processPayroll);
router.post('/payroll/calculate-preview', authorize('administrator'), calculatePayrollPreview);
router.post('/payroll/bulk-calculate', authorize('administrator'), bulkCalculatePayroll);
router.post('/payroll/bulk-process', authorize('administrator'), bulkProcessPayroll);
router.route('/payroll').get(getPayroll).post(authorize('administrator', 'manager'), createPayroll);
router.get('/payroll/:id', getPayrollById);
router.put('/payroll/:id', authorize('administrator', 'manager'), updatePayroll);
router.get('/payroll/:id/payslip', authorize('administrator', 'manager'), generatePayslip);
router.put('/payroll/:id/status', authorize('administrator', 'manager'), updatePayrollStatus);

// Leave routes
router.route('/leave').get(getLeaveRequests).post(createLeaveRequest);
router.get('/leave/stats', getLeaveStats);
router.get('/leave/:id', getLeaveById);
router.put('/leave/:id/status', authorize('administrator', 'manager'), updateLeaveStatus);
router.delete('/leave/:id', authorize('administrator', 'manager'), deleteLeaveRequest);

export default router;
