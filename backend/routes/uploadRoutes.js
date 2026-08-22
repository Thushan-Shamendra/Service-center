import express from 'express';
import { protect } from '../middleware/auth.js';
import { upload, setUploadSubDir, uploadToCloudinary, uploadMemory, uploadBase64ToCloudinary } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

// Single file upload with Cloudinary
router.post(
  '/single',
  setUploadSubDir('uploads'),
  upload.single('file'),
  uploadToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.files?.[0] || null,
      message: 'File uploaded successfully',
    });
  }
);

// Multiple files upload with Cloudinary
router.post(
  '/multiple',
  setUploadSubDir('uploads'),
  upload.array('files', 10),
  uploadToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.files || [],
      message: 'Files uploaded successfully',
    });
  }
);

// Base64 upload with Cloudinary
router.post(
  '/base64',
  setUploadSubDir('uploads'),
  uploadMemory.single('file'),
  uploadBase64ToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.file || null,
      message: 'File uploaded successfully',
    });
  }
);

// Vehicle images upload
router.post(
  '/vehicle',
  setUploadSubDir('vehicles'),
  upload.array('images', 5),
  uploadToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.files || [],
      message: 'Vehicle images uploaded successfully',
    });
  }
);

// Job card evidence upload
router.post(
  '/job-card',
  setUploadSubDir('job-cards'),
  upload.array('evidence', 10),
  uploadToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.files || [],
      message: 'Job card evidence uploaded successfully',
    });
  }
);

// Profile photo upload
router.post(
  '/profile',
  setUploadSubDir('profiles'),
  upload.single('photo'),
  uploadToCloudinary,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body.files?.[0] || null,
      message: 'Profile photo uploaded successfully',
    });
  }
);

export default router;
