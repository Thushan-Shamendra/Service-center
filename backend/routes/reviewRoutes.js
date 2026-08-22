import express from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getCustomerReviews,
  approveReview,
  rejectReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Public routes for customers
router
  .route('/')
  .get(getReviews)
  .post(createReview);

router
  .route('/:id')
  .get(getReviewById)
  .put(updateReview)
  .delete(deleteReview);

router.get('/customer/:customerId', getCustomerReviews);

// Admin/Manager routes for approval
router.put('/:id/approve', authorize('administrator', 'manager'), approveReview);
router.put('/:id/reject', authorize('administrator', 'manager'), rejectReview);

export default router;
