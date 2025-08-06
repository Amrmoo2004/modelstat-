import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
   name_en: {
    type: String,
    required: true
  },
  name_ar: {
    type: String,
    required: true
  },
  
    icon: { 
        type: String,
        default: "default-icon.png" 
    },
slug: { type: String, unique: true }
}, { timestamps: true });


export const categorymodel = mongoose.model("Category", categorySchema);