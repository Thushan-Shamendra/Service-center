import express from 'express';
import {
  getFinancialEntries,
  getFinancialEntryById,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinanceDashboard,
  getCategoryReport,
  getCashFlowReport,
  getFinancialManagementDashboard,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  getCashRegisters,
  createCashRegister,
  updateCashRegister,
  getPayables,
  createPayable,
  updatePayable,
  getBankTransactions,
  createBankTransaction,
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Dashboard and reports
router.get('/dashboard', authorize('administrator', 'manager'), getFinanceDashboard);
router.get('/management-dashboard', authorize('administrator', 'manager'), getFinancialManagementDashboard);
router.get('/report/category', authorize('administrator', 'manager'), getCategoryReport);
router.get('/report/cash-flow', authorize('administrator', 'manager'), getCashFlowReport);

// Financial entries
router
  .route('/entries')
  .get(authorize('administrator', 'manager'), getFinancialEntries)
  .post(authorize('administrator'), createFinancialEntry);

router
  .route('/entries/:id')
  .get(getFinancialEntryById)
  .put(authorize('administrator'), updateFinancialEntry)
  .delete(authorize('administrator'), deleteFinancialEntry);

// Bank accounts
router
  .route('/bank-accounts')
  .get(authorize('administrator', 'manager'), getBankAccounts)
  .post(authorize('administrator'), createBankAccount);

router
  .route('/bank-accounts/:id')
  .put(authorize('administrator'), updateBankAccount);

// Cash registers
router
  .route('/cash-registers')
  .get(authorize('administrator', 'manager'), getCashRegisters)
  .post(authorize('administrator'), createCashRegister);

router
  .route('/cash-registers/:id')
  .put(authorize('administrator'), updateCashRegister);

// Payables
router
  .route('/payables')
  .get(authorize('administrator', 'manager'), getPayables)
  .post(authorize('administrator'), createPayable);

router
  .route('/payables/:id')
  .put(authorize('administrator'), updatePayable);

// Bank transactions
router
  .route('/bank-transactions')
  .get(authorize('administrator', 'manager'), getBankTransactions)
  .post(authorize('administrator'), createBankTransaction);

export default router;
