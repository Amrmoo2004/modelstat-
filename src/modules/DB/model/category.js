import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
   name_en: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Books']
  },
  name_ar: {
    type: String,
    required: true,
    enum: ['إلكترونيات', 'ملابس', 'كتب']
  },    
  
    icon: { 
        type: String,
        default: "default-icon.png" 
    },
slug: { type: String, unique: true }
}, { timestamps: true });


export const categorymodel = mongoose.model("Category", categorySchema);