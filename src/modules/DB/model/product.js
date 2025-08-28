import mongoose from "mongoose";
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
  name_en: {
    type: String,
    trim: true,
    maxlength: [100, "English name cannot exceed 100 characters"]
  },
  name_ar: {
    type: String,
    trim: true,
    maxlength: [100, "Arabic name cannot exceed 100 characters"]
  },  Price: { type: Number, min: 0 },

  images: [{
    secure_url: { type: String, required: true },
    url: { type: String },
    public_id: { type: String },
    asset_id: { type: String }
  }],
  sizes: [{ type: String, required: false }],
  colors: [{ type: String, required: false }],
  description_en: { type: String, trim: true },
  description_ar: { type: String, trim: true },
  category: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      validate: {
        validator: async function(id) {
          const category = await mongoose.model('Category').findById(id);
          return !!category;
        },
        message: 'Invalid category reference'
      }
    },
    name_en: { type: String, required: true },
    name_ar: { type: String, required: true }
  },
      discountedPrice: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  offers: [{
    name_en: String,
    name_ar: String,
    discountType: { type: String, enum: ['percentage', 'fixed', 'bogo'] },
    discountValue: Number,
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    offerCode: { type: String, uppercase: true, sparse: true },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },

  }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  isActive: { type: Boolean, default: true },
  isBestSeller: { type: Boolean, default: false },
  bestSellerRank: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name_en: 'text', name_ar: 'text', description_en: 'text', description_ar: 'text' });
productSchema.index({ 'category._id': 1 });
productSchema.index({ Price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ rating: 1 });
productSchema.index({ 'offers.endDate': 1 });
productSchema.index({ 'offers.isActive': 1 });

// Virtual for current price
productSchema.virtual('currentPrice').get(function() {
  const activeOffer = this.getBestActiveOffer();
  if (activeOffer) {
    return this.calculateDiscountedPrice(activeOffer);
  }
  return this.Price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  const activeOffer = this.getBestActiveOffer();
  if (activeOffer && activeOffer.discountType === 'percentage') {
    return activeOffer.discountValue;
  }
  return 0;
});

// Method to get the best active offer
productSchema.methods.getBestActiveOffer = function() {
  const now = new Date();
  const activeOffers = this.offers.filter(offer => 
    offer.isActive && 
    offer.startDate <= now && 
    (!offer.endDate || offer.endDate >= now)
  );
  
  if (activeOffers.length === 0) return null;
  
  // Return the offer with highest discount value
  return activeOffers.sort((a, b) => {
    const aValue = a.discountType === 'percentage' ? a.discountValue : (a.discountValue / this.Price) * 100;
    const bValue = b.discountType === 'percentage' ? b.discountValue : (b.discountValue / this.Price) * 100;
    return bValue - aValue;
  })[0];
};

// Method to calculate discounted price
productSchema.methods.calculateDiscountedPrice = function(offer) {
  if (!offer || !offer.isActive) return this.Price;
  
  const now = new Date();
  if (now < offer.startDate || (offer.endDate && now > offer.endDate)) return this.Price;
  
  let discountedPrice = this.Price;
  
  switch (offer.discountType) {
    case 'percentage':
      discountedPrice = this.Price * (1 - offer.discountValue / 100);
      break;
    case 'fixed':
      discountedPrice = Math.max(0, this.Price - offer.discountValue);
      break;
    case 'bogo':
      // Buy One Get One - you might need to implement this differently
      break;
  }
  
  return Math.round(discountedPrice * 100) / 100;
};

// Check if product has active offers
productSchema.methods.hasActiveOffers = function() {
  const now = new Date();
  return this.offers.some(offer => 
    offer.isActive && 
    offer.startDate <= now && 
    (!offer.endDate || offer.endDate >= now)
  );
};

// Static method to find products with offers
productSchema.statics.findProductsWithOffers = function(limit = 10, category = null) {
  const now = new Date();
  const query = { 
    isActive: true,
    'offers.isActive': true,
    'offers.startDate': { $lte: now },
    $or: [
      { 'offers.endDate': { $gte: now } },
      { 'offers.endDate': null }
    ]
  };
  
  if (category) {
    query['category._id'] = category;
  }
  
  return this.find(query)
    .sort({ 'offers.discountValue': -1, salesCount: -1 })
    .limit(limit)
    .select('name_en name_ar Price images category salesCount rating offers');
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Set original price if not set
  if (!this.originalPrice) {
    this.originalPrice = this.Price;
  }
  
  next();
});

export const productmodel = mongoose.model("Product", productSchema);