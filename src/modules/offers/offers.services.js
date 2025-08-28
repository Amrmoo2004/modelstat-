import { productmodel } from "../DB/model/product.js";
import { asynchandler } from "../utilities/response/response.js";
import { successResponse } from "../utilities/response/response.js"; 

export const addOrUpdateOffer = asynchandler(async (req, res, next) => {
  const { id } = req.params;
  const offerData = req.body;

  if (!offerData.discountType || offerData.discountValue === undefined) {
    return next(new Error('Discount type and value are required', { cause: 400 }));
  }

  const validDiscountTypes = ['percentage', 'fixed', 'bogo'];
  if (!validDiscountTypes.includes(offerData.discountType)) {
    return next(new Error('Invalid discount type', { cause: 400 }));
  }

  const product = await productmodel.findById(id);
  if (!product) {
    return next(new Error('Product not found', { cause: 404 }));
  }



  if (typeof offerData.discountValue !== 'number' || isNaN(offerData.discountValue) || offerData.discountValue < 0) {
    return next(new Error('Invalid discount value', { cause: 400 }));
  }

  let discountedPrice = product.Price;
  let discountPercentage = 0;
  
  if (offerData.discountType === 'percentage') {
    const validDiscountValue = Math.min(offerData.discountValue, 100);
    discountedPrice = product.Price * (1 - (validDiscountValue / 100));
    discountPercentage = validDiscountValue;
  } else if (offerData.discountType === 'fixed') {
    const validDiscountValue = Math.min(offerData.discountValue, product.Price);
    discountedPrice = product.Price - validDiscountValue;
    discountPercentage = Math.round((validDiscountValue / product.Price) * 100);
  }

  discountedPrice = Math.max(0, discountedPrice);

  discountedPrice = Math.round(discountedPrice * 100) / 100;

  if (offerData._id) {
    const offerIndex = product.offers.findIndex(o => o._id.toString() === offerData._id);
    if (offerIndex === -1) {
      return next(new Error('Offer not found', { cause: 404 }));
    }

    Object.keys(offerData).forEach(key => {
      if (key !== '_id' && offerData[key] !== undefined) {
        product.offers[offerIndex][key] = offerData[key];
      }
    });
  } else {
    const currentDate = new Date();

    const newOffer = {
      name_en: offerData.name_en || 'New Offer',
      name_ar: offerData.name_ar || 'عرض جديد',
      discountType: offerData.discountType,
      discountValue: offerData.discountValue,
      startDate: currentDate,
      endDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now,
      offerCode: offerData.offerCode || `OFF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      usageLimit: offerData.usageLimit || 0,
      usedCount: 0,
      isActive: offerData.isActive !== undefined ? offerData.isActive : true,
      createdAt: new Date()
    };

    product.offers.push(newOffer);
  }

  product.discountedPrice = discountedPrice;
  product.discountPercentage = discountPercentage;

  await product.save();

  const updatedProduct = await productmodel.findById(id)
    .populate('category', 'name_en name_ar');

  return successResponse(res, {
    message: offerData._id ? "Offer updated successfully" : "Offer added successfully",
    data: updatedProduct
  });
});
export const removeOffer = asynchandler(async (req, res, next) => {
  const { id, offerId } = req.params; // Changed from productId to id

  const product = await productmodel.findById(id); // Changed from productId to id
  if (!product) {
    return next(new Error('Product not found', { cause: 404 }));
  }

  const offerIndex = product.offers.findIndex(o => o._id.toString() === offerId);
  if (offerIndex === -1) {
    return next(new Error('Offer not found', { cause: 404 }));
  }

  product.offers.splice(offerIndex, 1);
  await product.save();

  return successResponse(res, {
    message: "Offer removed successfully",
    data: product
  });
});

export const getProductOffers = asynchandler(async (req, res, next) => {
  const { id } = req.params; // Changed from productId to id
  const { activeOnly = 'false' } = req.query;

  const product = await productmodel.findById(id) // Changed from productId to id
    .select('name_en name_ar Price offers');
  
  if (!product) {
    return next(new Error('Product not found', { cause: 404 }));
  }

  let offers = product.offers || [];
  
  // Filter active offers if requested
  if (activeOnly === 'true') {
    const now = new Date();
    offers = offers.filter(offer => 
      offer.isActive && 
      offer.startDate <= now && 
      (!offer.endDate || offer.endDate >= now)
    );
  }

  // Sort offers by creation date (newest first)
  offers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({
    success: true,
    data: {
      product: {
        _id: product._id,
        name_en: product.name_en,
        name_ar: product.name_ar,
        Price: product.Price
      },
      offers,
      count: offers.length
    }
  });
});

export const getOfferById = asynchandler(async (req, res, next) => {
  const { id, offerId } = req.params; // Changed from productId to id

  const product = await productmodel.findById(id) // Changed from productId to id
    .select('name_en name_ar Price offers');
  
  if (!product) {
    return next(new Error('Product not found', { cause: 404 }));
  }

  const offer = product.offers.id(offerId);
  if (!offer) {
    return next(new Error('Offer not found', { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    data: {
      product: {
        _id: product._id,
        name_en: product.name_en,
        name_ar: product.name_ar,
        Price: product.Price
      },
      offer
    }
  });
});

// GET - Get all products with active offers
export const getProductsWithActiveOffers = asynchandler(async (req, res, next) => {
  const { category, page = 1, limit = 10 } = req.query;
  const now = new Date();

  // Build the query
  const query = {
    isActive: true,
    offers: {
      $elemMatch: {
        isActive: true,
        startDate: { $lte: now },
        $or: [
          { endDate: { $gte: now } },
          { endDate: null }
        ]
      }
    }
  };

  if (category) {
    query.category = category;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await productmodel.find(query)
    .select('name_en name_ar Price images category offers salesCount rating')
    .limit(limitNum)
    .skip(skip)
    .sort({ createdAt: -1 });

  const totalCount = await productmodel.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    }
  });
});

export const updateOffer = asynchandler(async (req, res, next) => {
  const { id, offerId } = req.params; // Already using id
  const updateData = req.body;

  const product = await productmodel.findById(id);
  if (!product) {
    return next(new Error('Product not found', { cause: 404 }));
  }

  const offer = product.offers.id(offerId);
  if (!offer) {
    return next(new Error('Offer not found', { cause: 404 }));
  }

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      offer[key] = updateData[key];
    }
  });

  await product.save();

  return successResponse(res, {
    message: 'Offer updated successfully',
    data: product
  });
});

export const applyBulkOffers = asynchandler(async (req, res, next) => {
  const { ids, offerData } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new Error('Product IDs array is required', { cause: 400 }));
  }

  if (!offerData.offerCode) {
    offerData.offerCode = `BULK${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  const bulkOperations = ids.map(id => ({
    updateOne: {
      filter: { _id: id },
      update: {
        $push: { 
          offers: {
            ...offerData,
            createdAt: new Date(),
            usedCount: 0
          }
        }
      }
    }
  }));

  const result = await productmodel.bulkWrite(bulkOperations);

  return successResponse(res, {
    message: `Offer applied to ${result.modifiedCount} products`,
    data: { modifiedCount: result.modifiedCount }
  });
});