import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name_ar: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true  
    },
    name_en: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true  
    },
  
    icon: {
        type: String,
        default: "default-icon.png" 
    }
}, { 
    timestamps: true 
});

export const categorymodel = mongoose.model("Category", categorySchema);