import express from 'express';
import {
  getSalaryAdvances,
  getSalaryAdvanceById,
  createSalaryAdvance,
  updateAdvanceStatus,
  getAdvanceStats,
  deleteSalaryAdvance,
  updateAdvanceDeduction,
} from '../controllers/salaryAdvanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Salary advance routes
router.route('/salary-advances').get(getSalaryAdvances).post(authorize('administrator', 'manager'), createSalaryAdvance);
router.get('/salary-advances/stats', getAdvanceStats);
router.get('/salary-advances/:id', getSalaryAdvanceById);
router.put('/salary-advances/:id/status', authorize('administrator', 'manager'), updateAdvanceStatus);
router.put('/salary-advances/:id/deduction', authorize('administrator'), updateAdvanceDeduction);
router.delete('/salary-advances/:id', authorize('administrator', 'manager'), deleteSalaryAdvance);

export default router;
