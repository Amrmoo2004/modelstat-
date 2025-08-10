import Joi from 'joi';
import { roleEnum} from '../auth/auth.services.js';

// Common validation patterns
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
const phonePattern = /^\+?[1-9]\d{1,14}$/; // E.164 format

export const authValidators = {
  // Signup Validation
  signup: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(passwordPattern)
      .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number ')
      .required(),
    phone: Joi.string().pattern(phonePattern).required(),
    role: Joi.string().valid(...Object.values(roleEnum)).default(roleEnum.USER)
  }),

  // Login Validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Google Auth Validation
  googleAuth: Joi.object({
    idtoken: Joi.string().required()
  }),

  // OTP Validation
  otp: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required()
  }),

  // Resend OTP Validation
  resendOtp: Joi.object({
    email: Joi.string().email().required()
  }),

  // Email Verification Validation
  verifyEmail: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required()
  })
};
export default authValidators;