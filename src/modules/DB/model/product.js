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
  },
  images: [{
    secure_url: {
      type: String,
      required: true
    },
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
    asset_id: {
      type: String
    }
  }],
  sizes: [{
    type: String,
    required: false
  }],
  colors: [{
    type: String,
    required: false
  }],

  description_en: {
    type: String,
    trim: true
  },
  description_ar: {  // Fixed - changed from ObjectId to String
    type: String,
    trim: true
  },
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
  basePrice: { 
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: { 
    type: Number,
    required: true,
    min: 0
  },
    Price: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    default: 0
  },
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
    createdAt: { type: Date, default: Date.now }
  }],  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


productSchema.index({ name_en: 'text', name_ar: 'text', description_en: 'text', description_ar: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ rating: 1 });


productSchema.virtual('currentPrice').get(function() {
  const activeOffer = this.getBestActiveOffer();
  if (activeOffer) {
    return this.calculateDiscountedPrice(activeOffer);
  }
  return this.price;
});

productSchema.virtual('discountPercentage').get(function() {
  const activeOffer = this.getBestActiveOffer();
  if (activeOffer && activeOffer.discountType === 'percentage') {
    return activeOffer.discountValue;
  }
  return 0;
});

productSchema.methods.getBestActiveOffer = function() {
  const now = new Date();
  const activeOffers = this.offers.filter(offer => 
    offer.isActive && 
    offer.startDate <= now && 
    offer.endDate >= now
  );
  
  if (activeOffers.length === 0) return null;
  
  return activeOffers.sort((a, b) => {
    const aValue = a.discountType === 'percentage' ? a.discountValue : (a.discountValue / this.price) * 100;
    const bValue = b.discountType === 'percentage' ? b.discountValue : (b.discountValue / this.price) * 100;
    return bValue - aValue;
  })[0];
};

productSchema.methods.calculateDiscountedPrice = function(offer) {
  if (!offer || !offer.isActive) return this.price;
  
  const now = new Date();
  if (now < offer.startDate || now > offer.endDate) return this.price;
  
  let discountedPrice = this.price;
  
  switch (offer.discountType) {
    case 'percentage':
      discountedPrice = this.price * (1 - offer.discountValue / 100);
      break;
    case 'fixed':
      discountedPrice = Math.max(0, this.price - offer.discountValue);
      break;
    case 'free_shipping':
      break;
  }
  
  return Math.round(discountedPrice * 100) / 100;
};

productSchema.methods.hasActiveOffers = function() {
  const now = new Date();
  return this.offers.some(offer => 
    offer.isActive && 
    offer.startDate <= now && 
    offer.endDate >= now
  );
};

productSchema.statics.findBestSellers = function(limit = 10, category = null) {
  const query = { 
    isBestSeller: true, 
    isActive: true 
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ bestSellerRank: 1, salesCount: -1 })
    .limit(limit)
    .select('name price originalPrice images category salesCount rating offers');
};

productSchema.statics.findProductsWithOffers = function(limit = 10, category = null) {
  const now = new Date();
  const query = { 
    isActive: true,
    'offers.isActive': true,
    'offers.startDate': { $lte: now },
    'offers.endDate': { $gte: now }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ 'offers.discountValue': -1, salesCount: -1 })
    .limit(limit)
    .select('name price originalPrice images category salesCount rating offers');
};

productSchema.statics.updateBestSellers = async function() {
  const categories = await this.distinct('category');
  
  for (const category of categories) {
    await this.updateMany(
      { category, isBestSeller: true },
      { isBestSeller: false, bestSellerRank: 0 }
    );
    
    const topProducts = await this.find({ category, isActive: true })
      .sort({ salesCount: -1 })
      .limit(10)
      .select('_id');
    
    for (let i = 0; i < topProducts.length; i++) {
      await this.findByIdAndUpdate(topProducts[i]._id, {
        isBestSeller: true,
        bestSellerRank: i + 1
      });
    }
  }
};

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (!this.originalPrice) {
    this.originalPrice = this.price;
  }
  
  next();
});

export const productmodel = mongoose.model("Product", productSchema);