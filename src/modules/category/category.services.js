import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js";
import { globalErrorHandler } from "../utilities/response/response.js";
import { withCache } from "../utilities/cacheing/cache.util.js";
export const createCategory = asynchandler(async (req, res) => {
    
     const { name_ar, name_en, icon } = req.body;

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            error: "Request body is missing or empty"
        });
    }

    const missingFields = [];
    if (!name_ar) missingFields.push('name_ar');
    if (!name_en) missingFields.push('name_en');
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `The following fields are required: ${missingFields.join(', ')}`,
            fields: missingFields
        });
    }


        const existingCategory = await categorymodel.findOne({ 
            $or: [{ name_ar }, { name_en }] 
        });

        if (existingCategory) {
            const conflictField = existingCategory.name_ar === name_ar ? 'name_ar' : 'name_en';
            return res.status(409).json({
                success: false,
                error: `Category with this ${conflictField} already exists`,
                conflictingField: conflictField,
                existingCategory: existingCategory
            });
        }

        const newCategory = await categorymodel.create({
            name_ar,
            name_en,
            icon: icon || undefined 
        });

        return successResponse(
            res,
            {
                message: "Category created successfully",
                data: newCategory
            },
            201
        );

    })

export const getAllCategories = asynchandler(async (req, res) => {
    const categories = await categorymodel.find();
    return successResponse(res, { data: categories });
});
export const findCategoryByNameHandler = asynchandler(async (req, res,next) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return next (new Error("Category name is required", { cause: 400 }));
    }

    const category = await categorymodel.findOne({
      $or: [{ name_ar: name }, { name_en: name }]
    });
    
    
    if (!category) {
      return next(new Error(`Category with name '${name}' not found`, { cause: 404 }));
    }
    
    return successResponse(res, { data: category });
  } catch (error) {
  return next(error);
  }
});

export const getCategoryById = asynchandler(async (req, res) => {
    const { id } = req.params;
    const category = await categorymodel.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    return successResponse(res, { data: category });
}); 
export const updateCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    const { name_ar, name_en, icon } = req.body;

    if (!name_ar || !name_en) {
        return res.status(400).json({ message: "Category name is required" });
    }

    const updatedCategory = await categorymodel.findByIdAndUpdate(
        id,
        { name_ar, name_en, icon },
        { new: true }
    );

    if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
    }

    return successResponse(res, { data: updatedCategory });
});
export const deleteCategory = asynchandler(async (req, res) => {
    const { id } = req.params;

    const deletedCategory = await categorymodel.findByIdAndDelete(id);

    if (!deletedCategory) {
        return res.status(404).json({ message: "Category not found" });
    }

    return successResponse(res, { message: "Category deleted successfully" });
});