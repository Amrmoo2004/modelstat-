import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js";
import { globalErrorHandler } from "../utilities/response/response.js";
import { withCache } from "../utilities/cacheing/cache.util.js";
 import { destroyFile, uploadFiles } from '../utilities/cloudinary/cloudinary.js';
 import { filevalidation } from "../multer/locaal.multer.js";
import fs from 'fs';

export const createCategory = asynchandler(async (req, res, next) => {
  const { name_ar, name_en } = req.body;
  const iconFile = req.file;

  // Validate required fields
  if (!name_ar || !name_en) {
    return next({
      message: "Both Arabic and English names are required",
      statusCode: 400
    });
  }

  // Check for existing category
  const existingCategory = await categorymodel.findOne({
    $or: [{ name_ar }, { name_en }]
  });

  if (existingCategory) {
    const conflictField = existingCategory.name_ar === name_ar ? 'name_ar' : 'name_en';
    return next({
      message: `Category with this ${conflictField} already exists`,
      statusCode: 409,
      metadata: { conflictingField: conflictField }
    });
  }

  // Process icon image if provided
  let iconData = null;
  if (iconFile) {
    try {
      // Log file info for debugging
      console.log('Processing file:', {
        originalname: iconFile.originalname,
        mimetype: iconFile.mimetype,
        size: iconFile.size
      });

      const uploadedIcon = await uploadFiles(
        [iconFile],
        `categories/icons`
      );

      iconData = {
        secure_url: uploadedIcon[0].secure_url,
        url: uploadedIcon[0].url,
        public_id: uploadedIcon[0].public_id,
        asset_id: uploadedIcon[0].asset_id
      };

      // Clean up temp file
      if (fs.existsSync(iconFile.path)) {
        fs.unlinkSync(iconFile.path);
      }
    } catch (error) {
      console.error('File upload error:', error);
      return next(new Error(`Icon upload failed: ${error.message}`));
    }
  } else {
    console.log('No icon file provided in request');
  }

  // Create category
  const newCategory = await categorymodel.create({
    name_ar,
    name_en,
    icon: iconData
  });

  return successResponse(res, {
    message: "Category created successfully",
    data: newCategory
  }, 201);
});
export const getAllCategories = asynchandler(async (req, res) => {
    const categories = await categorymodel.find().lean();
    return successResponse(res, { 
        message: "Categories retrieved successfully",
        data: categories 
    });
});

export const findCategoryByNameHandler = asynchandler(async (req, res, next) => {
  const name = req.params.name || req.query.name;    
    const category = await categorymodel.findOne({
        $or: [{ name_ar: name }, { name_en: name }]
    });
    
    if (!category) {
        return next({
            message: `Category with name '${name}' not found`,
            statusCode: 404
        });
    }
    
    return successResponse(res, { 
        message: "Category retrieved successfully",
        data: category 
    });
});

export const getCategoryById = asynchandler(async (req, res, next) => {
    const category = await categorymodel.findById(req.params.id);
    
    if (!category) {
        return next({
            message: "Category not found",
            statusCode: 404
        });
    }
    
    return successResponse(res, { 
        message: "Category retrieved successfully",
        data: category 
    });
});

export const updateCategory = asynchandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  
  const existingCategory = await categorymodel.findById(id);
  if (!existingCategory) {
    return next({
      message: "Category not found",
      statusCode: 404
    });
  }

  // Check if a file was uploaded with the correct field name
  if (req.file) {
    try {
      const iconFile = req.file;
      
      // Delete old icon if exists
      if (existingCategory.icon && existingCategory.icon.public_id) {
        await deleteFile(existingCategory.icon.public_id);
      }
      
      const uploadedIcon = await uploadFiles(
        [iconFile], 
        `categories/icons`
      );
      
      updateData.icon = {
        secure_url: uploadedIcon[0].secure_url,
        url: uploadedIcon[0].url,
        public_id: uploadedIcon[0].public_id,
        asset_id: uploadedIcon[0].asset_id
      };

      // Clean up temp file
      if (fs.existsSync(iconFile.path)) {
        fs.unlinkSync(iconFile.path);
      }
    } catch (error) {
      console.error('File upload error:', error);
      return next(new Error(`Icon upload failed: ${error.message}`));
    }
  }

  const updatedCategory = await categorymodel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return successResponse(res, {
    message: "Category updated successfully",
    data: updatedCategory
  });
});
export const deleteCategory = asynchandler(async (req, res, next) => {
    const deletedCategory = await categorymodel.findByIdAndDelete(req.query.id|| req.params.id);

    if (!deletedCategory) {
        return next({
            message: "Category not found",
            statusCode: 404
        });
    }

    return successResponse(res, {
        message: "Category deleted successfully"
    });
});