import { handleFileUpload } from './fileUpload.service.js';
import { uploadToCloudinary } from './cloudinary.service.js';

export const createUploadMiddleware = (options = {}) => {
  const fileUploadMiddleware = handleFileUpload(options);
  
  return async (req, res, next) => {
    try {
      // First handle file upload
      await new Promise((resolve) => {
        fileUploadMiddleware(req, res, (err) => {
          if (err) return next(err);
          resolve();
        });
      });

      // Then process to Cloudinary if files exist
      if (req.files?.length) {
        req.uploadedFiles = await uploadToCloudinary(req.files, {
          folder: options.cloudinaryFolder,
          transformations: options.transformations
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};