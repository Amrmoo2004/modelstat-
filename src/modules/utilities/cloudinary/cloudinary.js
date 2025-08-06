import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: 'dclziguvf', 
  api_key: '264586979866139', 
  api_secret: process.env.api_secret,
  secure: true
});

export const uploadToCloudinary = async (files, options = {}) => {
  const {
    folder = 'uploads',
    transformations = {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto'
    }
  } = options;

  try {
    const uploadPromises = files.map(file => 
      cloudinary.uploader.upload(file.path, {
        folder,
        transformation: transformations,
        resource_type: 'auto'
      })
    );

    const results = await Promise.all(uploadPromises);
    return results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    }));
  } finally {
    files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  }
};