import { productImageUploader } from './multer.config.js';
import fs from 'fs';

export const handleFileUpload = (options = {}) => {
  const {
    fieldName = 'images',
    maxFiles = 20,
    required = true
  } = options;

  return (req, res, next) => {
    const upload = productImageUploader.array(fieldName, maxFiles);
    
    upload(req, res, (err) => {
      if (err) {
        cleanupFiles(req.files);
        return next(new Error(`File upload failed: ${err.message}`));
      }
      
      if (required && (!req.files || !req.files.length)) {
        cleanupFiles(req.files);
        return next(new Error(`At least one file is required in field '${fieldName}'`));
      }
      
      next();
    });
  };
};

const cleanupFiles = (files) => {
  if (!files) return;
  files.forEach(file => {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
};