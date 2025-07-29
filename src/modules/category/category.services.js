import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js";
export const createCategory = asynchandler(async (req, res) => {
     const { name_ar, name_en, icon } = req.body;

    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            error: "Request body is missing or empty"
        });
    }

    // Validate required fields
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

    // Validate field lengths and patterns
    if (name_ar.length < 2 || name_ar.length > 50) {
        return res.status(400).json({
            success: false,
            error: "Arabic name must be between 2-50 characters"
        });
    }

    if (name_en.length < 2 || name_en.length > 50) {
        return res.status(400).json({
            success: false,
            error: "English name must be between 2-50 characters"
        });
    }

        // Check for existing category (both names)
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

        // Create new category
        const newCategory = await categorymodel.create({
            name_ar,
            name_en,
            icon: icon || undefined // Only include icon if provided
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