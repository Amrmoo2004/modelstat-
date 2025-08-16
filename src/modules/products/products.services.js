import { productmodel } from "../DB/model/product.js";
import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import {successResponse } from "../utilities/response/response.js";
    import { destroyFile, uploadFiles } from '../utilities/cloudinary/cloudinary.js';
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

  if (req.files?.length) {
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  }

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
    
    // First check if we have files to process
    if (req.files?.length) {
        try {
            const existingProduct = await productmodel.findById(id);
            if (!existingProduct) {
                return next(new Error('Product not found', { cause: 404 }));
            }

            // Delete old images if they exist
            if (existingProduct.images?.length) {
                await destroyFile(existingProduct.images.map(img => img.public_id));
            }

            // Upload new images
            const images = await uploadFiles(
                req.files, 
                `products/category/${existingProduct.category._id}/${existingProduct._id}`
            );


            // Update only images first
            await productmodel.findByIdAndUpdate(
                id,
                { 
                    $set: {
                        images: images.map(img => ({
                            secure_url: img.secure_url,
                            url: img.url,
                            public_id: img.public_id,
                            asset_id: img.asset_id
                        }))
                    }
                }
            );

            // Clean up temp files
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        } catch (error) {
            return next(new Error(`Image update failed: ${error.message}`));
        }
    }

    // Now handle regular field updates
    if (req.body) {
        const allowedFields = [
            'name_en', 'name_ar',
            'description_en', 'description_ar',
            'category_en', 'category_ar',
            'price', 'sizes', 'colour'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) { 
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length > 0) {
            // Process sizes if provided
            if (updates.sizes !== undefined) {
                try {
                    updates.sizes = Array.isArray(updates.sizes) 
                        ? updates.sizes 
                        : JSON.parse(updates.sizes);
                } catch (e) {
                    return next(new Error("Invalid sizes format", { cause: 400 }));
                }
            }

            await productmodel.findByIdAndUpdate(
                id,
                { $set: updates },
                { runValidators: true }
            );
        }
    }

    // Return the fully updated product
    const updatedProduct = await productmodel.findById(id)
        .populate('category', 'name_en name_ar');

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


