import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dclziguvf',
  api_key: '264586979866139',
  api_secret: process.env.api_secret,
  secure: true
});

export const uploadFile = async (file, path = "general") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${process.env.application_name}/${path}`
    });
  return {
      secure_url: result.secure_url,
      url: result.url,
      public_id: result.public_id,
      asset_id: result.asset_id
    };
  } catch (error) {
    // Clean up file if upload fails
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
};

export const uploadFiles = async (files = [], path = "general") => {
  const results = [];
  for (const file of files) {
    try {
      const result = await uploadFile(file, path);
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${file.originalname}:`, error);
      // Continue with other files even if one fails
    }
  }
  return results;
};

export const destroyFile = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};

