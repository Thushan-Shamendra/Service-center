import express from 'express';
import { getAuditLogs, getAuditLogById } from '../middleware/audit.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('administrator'), getAuditLogs);
router.get('/:id', authorize('administrator'), getAuditLogById);

export default router;
