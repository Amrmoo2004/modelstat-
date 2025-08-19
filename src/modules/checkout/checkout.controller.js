import e, { Router } from "express";
import * as checkout from "./checkout.services.js";
import { authUser } from "../middleware/authentaction.js";
import { checkoutMiddleware } from "../middleware/checkout.js";
import checkTokenRevoked from "../middleware/Check Tokens.js";

const router = Router();    
router.post('/create',authUser, checkTokenRevoked,checkoutMiddleware.validateCheckoutRequest ,checkout.createCheckout);
router.put('/update/:id', authUser, checkTokenRevoked, checkout.updateafterpayment);
router.post('/confirm/:id', authUser, checkTokenRevoked, checkout.confairmCheckout);
router


export default router;