import { productmodel } from "../DB/model/product.js";
import {asynchandler } from "../utilities/response/response.js";
import {successResponse } from "../utilities/response/response.js";
export const createproduct = asynchandler (async (req, res,next) => {
const {     name_ar, name_en,
    description_ar, description_en,
    category_ar, category_en,
    price, comments, rateing, sizes, images  } = req.body;
    if (!req.body) {
        return  next(new Error("Request body is missing", { cause: 400 }));
    }
    
    const existingProduct = await productmodel.findOne ({ name: { en: name_en, ar: name_ar } });
    if (existingProduct) {  
        return next(new Error(`Product '${name_en}' already exists`, { cause: 409 }));
    }   
     const newProduct = await productmodel.create({
    name_en,
    name_ar,
    description_en,
    description_ar,
    category_en,
    category_ar,

    price,
    sizes,
    images
  });

    await newProduct.save();
    return successResponse(
        res,
        {
            message: "Product created successfully",
            data: newProduct
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
    'price', 'sizes', 'images'
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






















