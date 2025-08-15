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
    secure_url: String,
    url: String,
    public_id: String,
    asset_id: String
  }

}, { timestamps: true });


export const categorymodel = mongoose.model("Category", categorySchema);