import Joi from 'joi';

// Common validation patterns
const arabicTextPattern = /^[\u0600-\u06FF\s]+$/;
const englishTextPattern = /^[a-zA-Z\s]+$/;
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

export const categoryValidators = {
  // Create Category Validation
  createCategory: Joi.object({
    name_ar: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Arabic name is required'
      }),
    
    name_en: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'English name is required'
      }),
    
    icon: Joi
      .optional()
      .messages({
        'string.uri': 'Icon must be a valid URL'
      }),
      
  }),

  // Update Category Validation
  updateCategory: Joi.object({
    name_ar: Joi.string()
      .min(2)
      .max(50)
      .optional(),
    
    name_en: Joi.string()
      .min(2)
      .max(50)
      .optional(),
    
    icon: Joi.string()
      .optional()
  }).min(1), // At least one field required for update

 

  // Category Name Validation
  categoryName: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Category name is required'
      })
  })
};