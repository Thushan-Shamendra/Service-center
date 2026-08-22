import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath, folder = 'vsms') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      max_file_size: 5000000,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (files, folder = 'vsms') => {
  try {
    const uploadPromises = files.map(file => uploadImage(file.path, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export const uploadBase64Image = async (base64String, folder = 'vsms') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    });
    return result;
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw error;
  }
};

export default cloudinary;
