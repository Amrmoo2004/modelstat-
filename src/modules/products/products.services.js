import { productmodel } from "../DB/model/product.js";
import { categorymodel } from "../DB/model/category.js";
import {asynchandler } from "../utilities/response/response.js";
import {successResponse } from "../utilities/response/response.js";
    import { destroyFile, uploadFiles } from '../utilities/cloudinary/cloudinary.js';
    import { ordermodel } from "../DB/model/order.js";
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
    
  } = req.body;

  if (!req.body) {
    return next(new Error("Request body is missing", { cause: 400 }));
  }

  const categoryExists = await categorymodel.findById(category);
  if (!categoryExists) {
    return next(new Error("Invalid category reference", { cause: 400 }));
  }

  let sizesArray = [];
  if (sizes) {
    try {
      sizesArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
    } catch (e) {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }


  const newProduct = await productmodel.create({
    name_en: name_en.trim(),
    name_ar: name_ar.trim(),
    description_en: description_en?.trim() || "",
    description_ar: description_ar?.trim() || "",
category: {
      _id: categoryExists._id,
      name_en: categoryExists.name_en,
      name_ar: categoryExists.name_ar
    },    Price: parseFloat(price),
    sizes: sizesArray,
        images: [], 
    cover: [],
    comments: [],
    rating: 0,
  });
  
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

  const id = req.params.id || req.query.id;
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
  const id = req.params.id || req.query.id;    
    if (req.files?.length) {
        try {
            const existingProduct = await productmodel.findById(id);
            if (!existingProduct) {
                return next(new Error('Product not found', { cause: 404 }));
            }

            if (existingProduct.images?.length) {
                await destroyFile(existingProduct.images.map(img => img.public_id));
            }

            const images = await uploadFiles(
                req.files, 
                `products/category/${existingProduct.category._id}/${existingProduct._id}`
            );


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
             'category',
            'price', 'sizes', 'colour,'
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

    const updatedProduct = await productmodel.findById(id)
        .populate('category', 'name_en name_ar');

    return successResponse(res, {
        message: "Product updated successfully",
        data: updatedProduct
    });
});
export const deleteProduct = asynchandler(async (req, res, next) => {

  const id = req.params.id || req.query.id;
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


export const  productsByCategory = asynchandler(async (req, res, next) => {
  const categoryId = req.params.id || req.query.id;
  
  if (!categoryId) {
    return next(new Error("Category ID is required", { cause: 400 }));
  }
  
  const products = await productmodel.find({ "category._id": categoryId })
    .populate('category', 'name_en name_ar');
  
  if (!products || products.length === 0) {
    return next(new Error(`No products found for category ID '${categoryId}'`, { cause: 404 }));
  }
  
  return successResponse(
    res,
    {
      message: "Products retrieved successfully",
      data: products
    },
    200
  );
});
export const bestSeller = asynchandler(async (req, res, next) => {
  try {
    const { timeframe = 'alltime', limit = '20' } = req.query;
    const limitNum = parseInt(limit, 10);

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ 
        error: "Invalid 'limit' parameter. Must be a positive number." 
      });
    }

    const validTimeframes = ['day', 'week', 'month', 'alltime'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: "Invalid 'timeframe' parameter. Must be 'day', 'week', 'month', or 'alltime'."
      });
    }

    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case "day":
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        dateFilter = { $gte: oneDayAgo };
        break;
      case "week":
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        dateFilter = { $gte: oneWeekAgo };
        break;
      case "month":
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        dateFilter = { $gte: oneMonthAgo };
        break;
      case "alltime":
        break;
    }

   const pipeline = [
      {
        $match: {
          status: { $ne: "Cancelled" },
          ispaid: true, 
          paymentstatus: "Completed",
          ...(timeframe !== "alltime" && { createdAt: dateFilter })
        }
      },
      { $unwind: "$orderitems" },
      
      // FIX: Extract the single productid from the array
      {
        $addFields: {
          "singleProductId": { $arrayElemAt: ["$orderitems.productid", 0] }
        }
      },
      
      {
        $group: {
          _id: "$singleProductId", // Use the extracted single ID
          totalQuantitySold: { $sum: "$orderitems.quantity" },
          totalRevenue: { $sum: { $multiply: ["$orderitems.quantity", "$orderitems.price"] } },
          // Capture product details from the order itself
          productName: { $first: "$orderitems.name" },
          productPrice: { $first: "$orderitems.price" },
          productImages: { $first: "$orderitems.images" }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: limitNum },
      
      // Try to lookup product details
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      
      {
        $project: {
          // Sales metrics
          totalQuantitySold: 1,
          totalRevenue: 1,
          
          // Use product details from lookup if available, otherwise from order
          name_en: { 
            $ifNull: [
              "$productDetails.name_en", 
              "$productName" // Fallback to order item name
            ]
          },
          name_ar: { 
            $ifNull: [
              "$productDetails.name_ar", 
              "$productName" // Fallback to order item name
            ]
          },
          description_en: { $ifNull: ["$productDetails.description_en", ""] },
          description_ar: { $ifNull: ["$productDetails.description_ar", ""] },
          price: { $ifNull: ["$productDetails.price", "$productPrice"] },
          images: { $ifNull: ["$productDetails.images", "$productImages"] },
          category: { $ifNull: ["$productDetails.category", ""] },
          sizes: { $ifNull: ["$productDetails.sizes", []] },
          colors: { $ifNull: ["$productDetails.colors", []] },
          inStock: { $ifNull: ["$productDetails.inStock", true] },
          rating: { $ifNull: ["$productDetails.rating", 0] },
          reviews: { $ifNull: ["$productDetails.reviews", []] },
          tags: { $ifNull: ["$productDetails.tags", []] },
          slug: { $ifNull: ["$productDetails.slug", ""] },
          sku: { $ifNull: ["$productDetails.sku", ""] },
          brand: { $ifNull: ["$productDetails.brand", ""] },
          specifications: { $ifNull: ["$productDetails.specifications", {}] },
          
          // IDs
          _id: { $ifNull: ["$productDetails._id", "$_id"] },
          productId: "$_id"
        }
      }
    ];

    const bestSellers = await ordermodel.aggregate(pipeline);

    res.json({
      success: true,
      timeframe,
      count: bestSellers.length,
      data: bestSellers
    });

  } catch (error) {
    console.error("Best sellers error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});