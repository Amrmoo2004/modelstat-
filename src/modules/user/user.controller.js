import { Router } from "express";

import * as user from "./user.services.js";
import { authUser } from "../middleware/authentaction.js";
import { cloudfileuploader } from "../multer/locaal.multer.js";
import { filevalidation } from "../multer/locaal.multer.js";
const router = Router();

router.post('/updatepassword',authUser, user.updatepassword)
router.get('/getprofile',authUser, user.getProfile)
router.put('/updateprofile',authUser,cloudfileuploader({ validation: filevalidation.Image }).single('avatar'), user.updateProfile)

export default router; 