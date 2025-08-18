import Joi from 'joi';

const arabicTextPattern = /^[\u0600-\u06FF\s]+$/;
const englishTextPattern = /^[a-zA-Z\s]+$/;
const pricePattern = /^\d+(\.\d{1,2})?$/;

export const productValidators = {
  // Create Product Validation
  createProduct: Joi.object({
    name_en: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': 'English name must contain only English letters',
        'string.empty': 'English name is required'
      }),
    
    name_ar: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': 'Arabic name must contain only Arabic letters',
        'string.empty': 'Arabic name is required'
      }),
    
    description_en: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    description_ar: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    category: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'Invalid category ID format',
        'string.length': 'Category ID must be 24 characters'
      }),
    
      price: Joi.string()
      .required()
      .messages({
        'string.pattern.base': 'Price must be a valid number with up to 2 decimal places'
        
      }),
    
    sizes: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string() // For JSON string
    ).optional()
  }),

  // Update Product Validation
  updateProduct: Joi.object({
    name_en: Joi.string()
      .min(3)
      .max(50)
      .optional(),
    
    name_ar: Joi.string()
      .min(3)
      .max(50)
      .optional(),
    
    description_en: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    description_ar: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    price: Joi.number()
      .positive()
      .optional(),
    
    sizes: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string() // For JSON string
    ).optional()
  }).min(1), // At least one field required for update

  // Product ID Validation
  productId: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'Invalid product ID format',
        'string.length': 'Product ID must be 24 characters'
      })
  }),

};