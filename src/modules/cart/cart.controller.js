import { Router } from "express";
import { 
  addToCart,
  getCart,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon 
} from "../cart/cart.services.js";
const router = Router();

router.post('/', addToCart);          // Add item
router.get('/',  getCart);            // Get cart
router.put('/items/:itemId',updateItem);     // Update quantity
router.delete('/items/:itemId', removeItem);  // Remove item
router.post('/coupons',applyCoupon);         // Apply coupon
router.delete('/',clearCart);                // Clear cart


export default router; 
