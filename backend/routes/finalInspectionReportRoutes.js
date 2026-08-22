import express from 'express';
import {
  getFinalInspectionReports,
  getFinalInspectionReportById,
  createFinalInspectionReport,
  updateFinalInspectionReport,
  getReportDataForJobCard,
} from '../controllers/finalInspectionReportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all final inspection reports for the authenticated technician
router.get('/', getFinalInspectionReports);

// Get report data for a job card (for form pre-fill)
router.get('/job-card/:jobCardId', getReportDataForJobCard);

// Create new final inspection report
router.post('/', createFinalInspectionReport);

// Get final inspection report by ID
router.get('/:id', getFinalInspectionReportById);

// Update final inspection report
router.put('/:id', updateFinalInspectionReport);

export default router;
