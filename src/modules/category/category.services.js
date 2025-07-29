import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js";
export const createCategory = asynchandler(async (req, res) => {
    const { name_ar,name_en, icon } = req.body;

     if (!req.body) {
        return res.status(400).json({
            success: false,
            error: "Request body is missing"
        });
    }


    if (!name_ar || !name_en) {
        return res.status(400).json({ message: "Category name is required" });
    }
     const existingCategory = await categorymodel.findOne({ 
        $or: [{ name_ar }, { name_en }] 
    });
 
  if (existingCategory) {
        const conflictField = existingCategory.name_ar === name_ar ? 'name_ar' : 'name_en';
        return res.status(409).json({
            success: false,
            error: `Category with this ${conflictField} already exists`,
            conflictingField: conflictField
        });
    }
    const newCategory = await categorymodel.create({
        name_ar,
        name_en,
        icon
    });


    await newCategory.save();

  return successResponse(
      res,
      {
        message: "Category created successfully",
        data: newCategory
      },
      201
    );


});

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