import express from 'express';
import {
  getFinalInspectionReports,
  getFinalInspectionReportById,
  createFinalInspectionReport,
  updateFinalInspectionReport,
  getReportDataForJobCard,
} from '../controllers/finalInspectionReportController.js';
import { protect } from '../middleware/auth.js';
import { upload, setUploadSubDir } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/evidence', setUploadSubDir('final-inspections'), (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Maximum file size is 10 MB' : error.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose a file to upload' });
    res.json({ success: true, data: { url: `/uploads/final-inspections/${req.file.filename}`, caption: req.file.originalname } });
  });
});

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
