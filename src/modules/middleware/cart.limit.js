// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 cart requests per window
  message: 'Too many cart updates. Please try again later.'
});

// In routes:
router.post('/cart/items', cartLimiter, addToCart);