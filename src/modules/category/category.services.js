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

  if (!name_ar || !name_en) {
    return next({
      message: "Both Arabic and English names are required",
      statusCode: 400
    });
  }

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

  let iconData = null;
  
  if (iconFile) {
    try {
      if (!iconFile.mimetype.startsWith('image/')) {
        return next({
          message: "Uploaded file must be an image",
          statusCode: 400
        });
      }

      const uploadedIcon = await uploadFiles(
        [iconFile],
        `/category/icons/temp_${Date.now()}` 
      );

      iconData = {
        secure_url: uploadedIcon[0].secure_url,
        url: uploadedIcon[0].url,
        public_id: uploadedIcon[0].public_id,
        asset_id: uploadedIcon[0].asset_id
      };

      if (fs.existsSync(iconFile.path)) {
        fs.unlinkSync(iconFile.path);
      }
    } catch (error) {
      console.error('File upload error:', error);
      return next(new Error(`Icon upload failed: ${error.message}`));
    }
  }

  try {
    const newCategory = await categorymodel.create({
      name_ar,
      name_en,
      icon: iconData 
    });

    if (iconData && iconData.public_id) {
      try {
        await renameFile(iconData.public_id, `/category/icons/${newCategory._id}`);
      } catch (renameError) {
        console.warn('Failed to rename image, but category was created:', renameError);
      }
    }

    return successResponse(res, {
      message: "Category created successfully",
      data: newCategory
    }, 201);

  } catch (dbError) {
    if (iconData && iconData.public_id) {
      try {
        await destroyFile(iconData.public_id);
      } catch (cleanupError) {
        console.error('Failed to cleanup image after category creation failed:', cleanupError);
      }
    }
    
    return next(new Error(`Category creation failed: ${dbError.message}`));
  }
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

  let iconData = null;
  
  // Process image upload first (before updating category)
  if (req.file) {
    try {
      const iconFile = req.file;
      
      // Validate file
      if (!iconFile.mimetype.startsWith('image/')) {
        return next({
          message: "Uploaded file must be an image",
          statusCode: 400
        });
      }

      // Upload new image first
      const uploadedIcon = await uploadFiles(
        [iconFile], 
        `/category/icons/temp_update_${Date.now()}` // Temporary path
      );
      
      iconData = {
        secure_url: uploadedIcon[0].secure_url,
        url: uploadedIcon[0].url,
        public_id: uploadedIcon[0].public_id,
        asset_id: uploadedIcon[0].asset_id
      };

      // Clean up temp file immediately
      if (fs.existsSync(iconFile.path)) {
        fs.unlinkSync(iconFile.path);
      }
    } catch (error) {
      console.error('File upload error:', error);
      return next(new Error(`Icon upload failed: ${error.message}`));
    }
  }

  // Now update the category
  try {
    // If we have a new icon, add it to update data
    if (iconData) {
      updateData.icon = iconData;
    }

    const updatedCategory = await categorymodel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // If update was successful and we uploaded a new image, 
    // delete the old image and rename the new one
    if (iconData && iconData.public_id) {
      try {
        // Delete old image if it exists
        if (existingCategory.icon && existingCategory.icon.public_id) {
          await destroyFile(existingCategory.icon.public_id);
        }
        
        // Rename the new image to use the category ID
        await renameFile(iconData.public_id, `/category/icons/${existingCategory._id}`);
        
        // Update the category with the final public_id
        updatedCategory.icon.public_id = `/category/icons/${existingCategory._id}`;
        await updatedCategory.save();
      } catch (cleanupError) {
        console.warn('Failed to cleanup old image or rename new image:', cleanupError);
        // This is non-critical - the update succeeded, just image management failed
      }
    }

    return successResponse(res, {
      message: "Category updated successfully",
      data: updatedCategory
    });

  } catch (dbError) {
    // If category update fails, clean up the uploaded image
    if (iconData && iconData.public_id) {
      try {
        await destroyFile(iconData.public_id);
      } catch (cleanupError) {
        console.error('Failed to cleanup image after category update failed:', cleanupError);
      }
    }
    
    return next(new Error(`Category update failed: ${dbError.message}`));
  }
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