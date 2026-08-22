import express from 'express';
import multer from 'multer';
import path from 'path';
import { getUsers, getUserById, createUser, updateUser, deleteUser, deleteUserPermanently, getNextUserId, getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.use(protect);

// Profile management routes (for authenticated users)
router.get('/profile', getProfile);
router.put('/profile', upload.single('profilePhoto'), updateProfile);
router.put('/change-password', changePassword);

// Get next user ID for a role
router.get('/next-id', authorize('administrator', 'manager'), getNextUserId);

router
  .route('/')
  .get(authorize('administrator', 'manager'), getUsers)
  .post(authorize('administrator', 'manager'), upload.single('profilePhoto'), createUser);

router
  .route('/:id')
  .get(authorize('administrator', 'manager'), getUserById)
  .put(authorize('administrator', 'manager'), upload.single('profilePhoto'), updateUser)
  .delete(authorize('administrator'), deleteUser);

router.delete('/:id/delete', authorize('administrator'), deleteUserPermanently);

export default router;
