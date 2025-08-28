//
import { productmodel } from "../DB/model/product.js";


export const addOfferToProduct = asynchandler(async (req, res, next) => {
  try {
    const { productId } = req.params; 
    const {
      name_en,       
      name_ar,     
      discountType,
      discountValue,
      startDate,
      endDate,
      offerCode,      
      usageLimit = 0,
      isActive = true
    } = req.body;

    if (!discountType || !discountValue) {
      return next(new Error("discountType and discountValue are required", { cause: 400 }));
    }

    const product = await productmodel.findById(productId);
    if (!product) {
      return next(new Error("Product not found", { cause: 404 }));
    }

    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
    
    if (end <= start) {
      return next(new Error("End date must be after start date", { cause: 400 }));
    }

    if (discountValue < 0) {
      return next(new Error("Discount value cannot be negative", { cause: 400 }));
    }

    if (offerCode) {
      const existingOffer = await productmodel.findOne({
        "offers.offerCode": offerCode.toUpperCase()
      });
      
      if (existingOffer) {
        return next(new Error("Offer code already exists", { cause: 400 }));
      }
    }

    const offerName_en = name_en || `${product.name_en} Special Offer`;
    const offerName_ar = name_ar || `${product.name_ar} عرض خاص`;

    const newOffer = {
      name_en: offerName_en,
      name_ar: offerName_ar,
      discountType,
      discountValue: parseFloat(discountValue),
      startDate: start,
      endDate: end,
      offerCode: offerCode ? offerCode.toUpperCase() : undefined,
      usageLimit: parseInt(usageLimit),
      usageCount: 0,
      isActive,
      createdAt: new Date()
    };

    product.offers.push(newOffer);
    await product.save();

    return successResponse(
      res,
      {
        message: "Offer added to product successfully",
        data: product
      },
      201
    );
  } catch (error) {
    return next(new Error(`Failed to add offer: ${error.message}`));
  }
});