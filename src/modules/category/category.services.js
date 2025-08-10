import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js";
import { globalErrorHandler } from "../utilities/response/response.js";
import { withCache } from "../utilities/cacheing/cache.util.js";


export const createCategory = asynchandler(async (req, res, next) => {
    const { name_ar, name_en, icon } = req.body;

    // Check for existing category (duplicate prevention)
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

    const newCategory = await categorymodel.create({
        name_ar,
        name_en,
        icon: icon || undefined
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
    const { name } = req.params;
    
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
    const updatedCategory = await categorymodel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedCategory) {
        return next({
            message: "Category not found",
            statusCode: 404
        });
    }

    return successResponse(res, {
        message: "Category updated successfully",
        data: updatedCategory
    });
});

export const deleteCategory = asynchandler(async (req, res, next) => {
    const deletedCategory = await categorymodel.findByIdAndDelete(req.params.id);

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