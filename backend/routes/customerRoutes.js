import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerVehicles,
  getCustomerServiceHistory,
  getCustomerInvoices,
  getCustomerAppointments,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('administrator', 'manager'), getCustomers)
  .post(authorize('administrator', 'manager'), createCustomer);

router
  .route('/:id')
  .get(getCustomerById)
  .put(authorize('administrator', 'manager'), updateCustomer);

router.get('/:id/vehicles', getCustomerVehicles);
router.get('/:id/service-history', getCustomerServiceHistory);
router.get('/:id/invoices', getCustomerInvoices);
router.get('/:id/appointments', getCustomerAppointments);

export default router;
