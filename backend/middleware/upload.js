import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadImage, uploadMultipleImages } from '../config/cloudinary.js';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subDir = req.uploadSubDir || 'general';
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /\.(jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi)$/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images, PDFs, and videos are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

export const setUploadSubDir = (subDir) => (req, res, next) => {
  req.uploadSubDir = subDir;
  next();
};

// Cloudinary upload middleware
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const folder = req.uploadSubDir || 'vsms';
    const uploadPromises = req.files.map(file => uploadImage(file.path, folder));
    const results = await Promise.all(uploadPromises);

    // Clean up local files after upload
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    // Attach Cloudinary results to request
    req.cloudinaryFiles = results;
    req.body.files = results.map(r => ({
      url: r.secure_url,
      publicId: r.public_id,
      format: r.format,
      size: r.bytes,
    }));

    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};

// Memory storage for base64 uploads
const memoryStorage = multer.memoryStorage();

export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for base64
});

export const uploadBase64ToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const folder = req.uploadSubDir || 'vsms';
    const result = await (await import('../config/cloudinary.js')).uploadBase64Image(base64String, folder);

    req.cloudinaryFile = result;
    req.body.file = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    };

    next();
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};
