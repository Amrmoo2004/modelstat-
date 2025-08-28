import  { Router } from "express";
import * as payment from "./payment.services.js";
import { authUser } from "../middleware/authentaction.js";
const router = Router();   

// Production payment routes
router.post('/initiate',authUser, payment.initiatePaymobPayment);
router.post('/webhook/paymob',authUser, payment.paymobWebhook);
router.get('/verify',authUser, payment.verifyPayment);

export default router;