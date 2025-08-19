import { Router } from "express";
import { 
  addToCart,
  getCart,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon 
} from "../cart/cart.services.js";
import { optionalAuth } from "../middleware/optionalauth.js";
const router = Router();
router.use(optionalAuth); 
router.post('/', addToCart);          
router.get('/',  getCart);           
router.put('/items/:itemId',updateItem);     
router.delete('/items/:itemId', removeItem);  
router.post('/coupons',applyCoupon);         
router.delete('/',clearCart);              

export default router; 
