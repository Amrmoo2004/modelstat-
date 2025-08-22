import  { Router } from "express";
import * as checkout from "./checkout.services.js";
import { authUser } from "../middleware/authentaction.js";
 import checkTokenRevoked from "../middleware/Check Tokens.js";

const router = Router();    
router.post('/create',authUser, checkTokenRevoked,checkout.createCheckout);
router.post('/update/:id', authUser, checkTokenRevoked, checkout.updateafterpayment);
router.post('/confirm/:id', authUser, checkTokenRevoked, checkout.confirmCheckout);
router.get('/all', authUser, checkTokenRevoked, checkout.getUserCheckouts);


export default router;