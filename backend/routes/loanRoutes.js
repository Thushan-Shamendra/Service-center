import express from 'express';
import {
  getLoans,
  getLoanById,
  createLoan,
  updateLoanStatus,
  getLoanStats,
  updateLoanRepayment,
  deleteLoan,
  updateLoan,
} from '../controllers/loanController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Loan routes
router.route('/loans').get(getLoans).post(authorize('administrator', 'manager', 'employee'), createLoan);
router.get('/loans/stats', getLoanStats);
router.get('/loans/:id', getLoanById);
router.put('/loans/:id/status', authorize('administrator', 'manager'), updateLoanStatus);
router.put('/loans/:id/repayment', authorize('administrator'), updateLoanRepayment);
router.put('/loans/:id', authorize('administrator', 'manager'), updateLoan);
router.delete('/loans/:id', authorize('administrator', 'manager'), deleteLoan);

export default router;
