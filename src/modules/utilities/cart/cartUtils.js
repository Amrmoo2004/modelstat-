import { cartmodel } from "../../DB/model/cart.js";
import { asynchandler } from "../response/response.js";
export const mergeCarts = asynchandler(async (userId, sessionId) => {
  // 1. Find the guest cart (if exists)
  const guestCart = await cartmodel.findOne({ sessionId });
  if (!guestCart || guestCart.items.length === 0) return;

  // 2. Find or create the user's cart
  let userCart = await cartmodel.findOne({ userId });

  if (!userCart) {
    userCart = new Cart({ userId, items: [] });
  }

  // 3. Merge items (avoid duplicates)
  guestCart.items.forEach(guestItem => {
    const existingItem = userCart.items.find(userItem => 
      userItem.productId.equals(guestItem.productId) &&
      JSON.stringify(userItem.variant) === JSON.stringify(guestItem.variant)
    );

    if (existingItem) {
      // Update quantity if same product+variant exists
      existingItem.quantity += guestItem.quantity;
    } else {
      // Add new item
      userCart.items.push(guestItem);
    }
  });

  // 4. Save the merged cart and delete the guest cart
  await userCart.save();
  await cartmodel.deleteOne({ _id: guestCart._id });
});