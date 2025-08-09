// models/Cart.js
import mongoose from 'mongoose';
import { stringify } from 'querystring';

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: String, // For guest users
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { 
      type: Number, 
      default: 1, 
      min: 1,
      required: true },
    price: { type: Number, required: true }, // Snapshot of price at time of addition
    name: String,
    image: String,
   variant: {
  color: String,
  size: String
}
     
    }
  ],
  coupon: {
    code: String,
    discount: { type: Number, default: 0 }
  },
  total: { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days expiry
},{

  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});



// Recalculate total before saving
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - this.coupon.discount;
  next();
});

export const cartmodel = mongoose.model('Cart', cartSchema);    