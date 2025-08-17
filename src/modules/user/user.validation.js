import { body, param, query } from 'express-validator';
import { UserModel } from '../DB/model/user.model.js';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
const phonePattern = /^(\+20|0)?1[0125][0-9]{8}$/;

// Common validators
const validateObjectId = (field) => 
  param(field)
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) throw new Error('User not found');
      return true;
    });

const validateQueryObjectId = (field) => 
  query(field)
    .isMongoId()
    .withMessage('Invalid ID format')
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) throw new Error('User not found');
      return true;
    });

export const validateUpdatePassword = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required')
    .matches(passwordPattern).withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .matches(passwordPattern).withMessage('Password must be 8+ chars with uppercase, lowercase, and number')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];
// Profile update validation
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(phonePattern).withMessage('Invalid phone number format')
];

// Role update validation
const validateUpdateRole = [
  validateObjectId('id').optional(),
  validateQueryObjectId('id').optional(),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['user', 'admin', 'moderator']).withMessage('Invalid role specified')
];

// Delete user validation
const validateDeleteUser = [
  validateObjectId('id').optional(),
  validateQueryObjectId('id').optional()
];

