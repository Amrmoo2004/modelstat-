import { Router } from "express";
import * as user from "./user.services.js";
import { authUser } from "../middleware/authentaction.js";
import { cloudfileuploader } from "../multer/locaal.multer.js";
import { filevalidation } from "../multer/locaal.multer.js";
import { validate } from '../middleware/validitor.js';
import { validateUpdatePassword } from "./user.validation.js";
const router = Router();

router.post('/updatepassword',authUser,validateUpdatePassword, user.updatepassword);
router.get('/getprofile',authUser, user.getProfile)
router.put('/updateprofile',authUser,cloudfileuploader({ validation: filevalidation.Image }).single('avatar'), user.updateProfile)

export default router; 