import mongoose from "mongoose";
const schema = mongoose.Schema;
const productSchema = new mongoose.Schema({
  name_en: { type: String, required: true },
  name_ar: { type: String, required: true },
  description_en: { type: String, required: true },
  description_ar: { type: String, required: true },
  category_en: { 
    type: String, 
    required: true,
    enum: ['Electronics', 'Clothing', 'Books']
  },
  category_ar: { 
    type: String, 
    required: true,
    enum: ['إلكترونيات', 'ملابس', 'كتب']
  },
  price: { type: Number, required: true },
  sizes: [String],
  images: [{
    public_id: String,
    url: String
  }]
}, { timestamps: true });

export const productmodel = mongoose.model("product", productSchema);