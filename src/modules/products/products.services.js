import { productmodel } from "../DB/model/product.js";
import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import {successResponse } from "../utilities/response/response.js";
 import { uploadFiles } from '../utilities/cloudinary/cloudinary.js';
import fs from 'fs';

export const createproduct = asynchandler(async (req, res, next) => {

  const { 
    name_en,
    name_ar, 
    description_ar, 
    description_en,
    category,
    price, 
    sizes,
    colour
  } = req.body;

  // Validate required fields
  if (!req.body) {
    return next(new Error("Request body is missing", { cause: 400 }));
  }

  // Validate category exists
  const categoryExists = await categorymodel.findById(category);
  if (!categoryExists) {
    return next(new Error("Invalid category reference", { cause: 400 }));
  }

  // Process sizes
  let sizesArray = [];
  if (sizes) {
    try {
      sizesArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
    } catch (e) {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }


  // Create product
  const newProduct = await productmodel.create({
    name_en: name_en.trim(),
    name_ar: name_ar.trim(),
    description_en: description_en?.trim() || "",
    description_ar: description_ar?.trim() || "",
category: {
      _id: categoryExists._id,
      name_en: categoryExists.name_en,
      name_ar: categoryExists.name_ar
    },    price: parseFloat(price),
    sizes: sizesArray,
        images: [], 
    cover: [],
    comments: [],
    rating: 0,
    colour: colour.trim()
  });
  
  // Upload images
  let images = [];
  if (req.files?.length) {
    try {
      images = await uploadFiles(req.files, `products/category/${categoryExists._id}/${newProduct._id}`);
    } catch (error) {
      return next(new Error(`Image upload failed: ${error.message}`));
    }
  }
      newProduct.images = images.map(img => ({
        secure_url: img.secure_url,
        url: img.url,
        public_id: img.public_id,
        asset_id: img.asset_id
      }));
      await newProduct.save();

  // Clean up files
  if (req.files?.length) {
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  }

  // Return response with populated category
  const populatedProduct = await productmodel.findById(newProduct._id)
    .populate('category', 'name_en name_ar');

  return successResponse(
    res,
    {
      message: "Product created successfully",
      data: populatedProduct
    },
    201
  );
});

export const getAllProducts = asynchandler(async (req, res, next) => {
    const products = await productmodel.find({});
    if (!products || products.length === 0) {
        return next(new Error("No products found", { cause: 404 }));
    }
    return successResponse(
        res,
        {
            message: "Products retrieved successfully",
            data: products
        },
        200
    );
})

export const getProductById = asynchandler(async (req, res, next) => {

    const { id } = req.params;
    if (!id) {
        return next(new Error("Product ID is required", { cause: 400 }));
    }
    
    const product = await productmodel.findById(id);
    if (!product) {
        return next(new Error(`Product with ID '${id}' not found`, { cause: 404 }));
    }
    
    return successResponse(
        res,
        {
            message: "Product retrieved successfully",
            data: product
        },
        200
    );
});
export const updateProduct = asynchandler(async (req, res, next) => {

    const { id } = req.params;
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(new Error('Request body must be a JSON object', { cause: 400 }));
  }

  const allowedFields = [
    'name_en', 'name_ar',
    'description_en', 'description_ar',
    'category_en', 'category_ar',
    'price', 'sizes'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) { 
      updates[field] = req.body[field];
    }
  }

  // 4. Validate updates
  if (Object.keys(updates).length === 0) {
    return next(new Error(
      `No valid fields provided. Allowed fields: ${allowedFields.join(', ')}`,
      { cause: 400 }
    ));
  }

  const updatedProduct = await productmodel.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    return next(new Error('Product not found', { cause: 404 }));
  }

  return successResponse(res, {
    message: "Product updated successfully",
    data: updatedProduct
  });
});
export const deleteProduct = asynchandler(async (req, res, next) => {

    const { id } = req.params;
    if (!id) {
        return next(new Error("Product ID is required", { cause: 400 }));
    }
    
    const deletedProduct = await productmodel.findByIdAndDelete(id);
    if (!deletedProduct) {
        return next(new Error(`Product with ID '${id}' not found`, { cause: 404 }));
    }
    
    return successResponse(
        res,
        {
            message: "Product deleted successfully",
            data: deletedProduct
        },
        200
    );
});