import { Router } from "express";
import * as auth from "./auth.services.js";
 import {  validate } from '../middleware/validitor.js';
import { authValidators } from './auth.vaildation.js';


const router = Router();

router.post('/signup', validate(authValidators.signup), auth.signup);
router.post('/login', validate(authValidators.login), auth.login);
router.post('/google/signup', validate(authValidators.googleAuth),auth.signupWithGmail);
router.post('/google/login', validate(authValidators.googleAuth),auth.loginWithGmail);
router.post('/verify-email', validate(authValidators.verifyEmail),auth.verifyEmail);
router.post('/resend-otp', validate(authValidators.resendOtp),auth.resendOtp);


export default router; 