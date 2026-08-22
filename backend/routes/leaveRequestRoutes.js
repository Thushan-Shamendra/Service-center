import express from 'express';
import {
  getLeaveBalance,
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../controllers/leaveRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Employee routes
router.get('/balance', getLeaveBalance);
router.get('/my-requests', getLeaveRequests);
router.post('/', createLeaveRequest);
router.put('/:id', updateLeaveRequest);
router.delete('/:id', cancelLeaveRequest);

// Manager/Admin routes
router.get('/all', authorize('administrator', 'manager'), getAllLeaveRequests);
router.get('/:id', getLeaveRequestById);
router.put('/:id/approve', authorize('administrator', 'manager'), approveLeaveRequest);
router.put('/:id/reject', authorize('administrator', 'manager'), rejectLeaveRequest);

export default router;
