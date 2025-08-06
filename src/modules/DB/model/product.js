  import mongoose from "mongoose";
  const schema = mongoose.Schema;
  const productSchema = new mongoose.Schema({
  name_en: {
    type: String,
    required: [true, "English name is required"],
    trim: true,
    maxlength: [100, "English name cannot exceed 100 characters"]
  },
  name_ar: {
    type: String,
    required: [true, "Arabic name is required"],
    trim: true,
    maxlength: [100, "Arabic name cannot exceed 100 characters"]
  },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    width: Number,
    height: Number,
    filename: String
  }],
  sizes: [{
    type: String,
    required: false
  }],

  description_en: {
    type: String,
    required: [true, "English description is required"],
    trim: true
  },
  description_ar: {  // Fixed - changed from ObjectId to String
    type: String,
    required: [true, "Arabic description is required"],
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
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be positive"]
  },
  // ... rest of your schema remains the same ...
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtuals for English/Arabic category names
productSchema.virtual('category_en').get(async function() {
  await this.populate('category');
  return this.category?.name_en;
});

productSchema.virtual('category_ar').get(async function() {
  await this.populate('category');
  return this.category?.name_ar;
});

// Update indexes (removed category_en/category_ar indexes)
productSchema.index({ name_en: 'text', name_ar: 'text', description_en: 'text', description_ar: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });

export const productmodel = mongoose.model("Product", productSchema);