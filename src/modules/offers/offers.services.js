import { productmodel } from "../DB/model/product.js";
import { asynchandler } from "../utilities/response/response.js";

export const addProductOffer = asynchandler(async (req, res, next) => {
    const { productId } = req.params||req.body;
    const offerData = req.body;
  const product = await productmodel.findById(productId);
  product.offers.push({
    name: offerData.name,
    discountType: offerData.type,
    discountValue: offerData.value,
    startDate: offerData.startDate || new Date(),
    endDate: offerData.endDate,
    isActive: true
  });
  await product.save();
});