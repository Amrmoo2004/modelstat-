import { productmodel } from "../DB/model/product.js";
import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import {successResponse } from "../utilities/response/response.js";
import { ImageUploader } from '../multer/locaal.multer.js';
import { uploadToCloudinary} from '../utilities/cloudinary/cloudinary.js';
import fs from 'fs';


  // Helper function to clean up files
const cleanupFiles = (files) => {
  if (!files) return;
  files.forEach(file => {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
};


export const uploadProductImagesbyID = asynchandler(async (req, res,next) => {
  const { productId } = req.query; 

  if (!req.is('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  const uploadMiddleware = ImageUploader.array('images', 20);
  
  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (req.files) cleanupFiles(req.files);
        return reject(new Error(`File upload failed: ${err.message}`));
      }
      if (!req.files?.length) {
        return reject(new Error('At least one image is required'));
      }
      resolve();
    }); 
  });

  try {
    // Upload to Cloudinary
    const uploadedImages = await uploadToCloudinary(req.files, {
      folder: `uploads/product_images/${productId}`, // Changed to Cloudinary-friendly format
      transformations: {
        width: 1200,
        height: 1200,
        crop: 'limit', 
        quality: 'auto'
      }
    });

    // Format images data
    const formattedImages = uploadedImages.map((img, index) => ({
      url: img.url,
      public_id: img.publicId,
      width: img.width,
      height: img.height,
      filename: img.originalname || req.files[index].originalname || `product-${productId}-${Date.now()}-${index}`
    }));

    const updatedProduct = await productmodel.findByIdAndUpdate(
      productId,
      { $push: { images: { $each: formattedImages } } },
      { new: true, runValidators: true }
    ).populate('category');

    if (!updatedProduct) {
      return next(new Error('Product not found', { cause: 404 }));
    }

    // Clean up temp files
    cleanupFiles(req.files);

    return res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: updatedProduct
    });

  } catch (error) {
    cleanupFiles(req.files);
    return next(error);
  }
});



export const createproduct = asynchandler(async (req, res, next) => {
     const { 
        name_ar, 
        name_en,
        description_ar, 
        description_en,
        category,
        price, 
        comments, 
        rating, 
        sizes
    } = req.body;

    // Validate required fields
    if (!req.body) {
        return next(new Error("Request body is missing", { cause: 400 }));
    }

    // Validate category exists
    if (!category) {
        return next(new Error("Category reference is required", { cause: 400 }));
    }

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

    // Process images if they exist in the request
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
        try {
            uploadedImages = await uploadToCloudinary(req.files, {
                folder: `./uploads/product_Images/${productId}`,
                transformations: {
                    width: 1200,
                    height: 1200,
                    crop: 'limit',
                    quality: 'auto'
                }
            });

            // Format images for database
            uploadedImages = uploadedImages.map(img => ({
                url: img.url,
                public_id: img.publicId,
                width: img.width,
                height: img.height,
                filename: img.originalname || `product-${Date.now()}`
            }));
        } catch (error) {
            // Clean up any uploaded files on error
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            return next(new Error(`Image upload failed: ${error.message}`, { cause: 500 }));
        }
    }

    // Create the product
    const newProduct = await productmodel.create({
        name_en: name_en.trim(),
        name_ar: name_ar.trim(),
        description_en: description_en.trim(),
        description_ar: description_ar.trim(),
                name_en: name_en.trim(),

        category: {  
            _id: categoryExists._id,
            name_en: categoryExists.name_en,
            name_ar: categoryExists.name_ar
        },
        price: parseFloat(price),
        sizes: sizesArray,
        images: uploadedImages, 
        comments: comments || [],
        rating: rating || 0
    });


    if (req.files) {
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    }

    // Populate category details in the response
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