// models/Cart.js
import mongoose from 'mongoose';
import { stringify } from 'querystring';

const cartItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 1, 
    min: 1,
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  name: String,
  image: String,
  sizes: [{  // ADD THIS
    type: String
  }],
  colour: {  // ADD THIS
    type: String
  }
}, { _id: false });  // Add _id: false for cleaner structure

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  sessionId: String,
  items: [cartItemSchema],  // Use the defined schema
  coupon: {
    code: String,
    discount: { 
      type: Number, 
      default: 0 
    }
  },
  total: { 
    type: Number, 
    default: 0 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
  }
}, {
  timestamps: true,  // Add timestamps
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total quantity
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Recalculate total before saving
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - this.coupon.discount;
  next();
});

export const cartmodel = mongoose.model('Cart', cartSchema);