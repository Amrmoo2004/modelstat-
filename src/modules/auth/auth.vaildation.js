import Joi from 'joi';
import { roleEnum} from '../auth/auth.services.js';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
const phonePattern = /^\(01[0-2,5]{1}[0-9]{8})$/ 

export const authValidators = {
  signup: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(passwordPattern)
      .message('Password must contain at least 8 characters, one uppercase, one lowercase, one number ')
      .required(),
    phone: Joi.string().pattern(phonePattern).required(),
    role: Joi.string().valid(...Object.values(roleEnum)).default(roleEnum.USER),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' })
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