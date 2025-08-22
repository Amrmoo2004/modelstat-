import  { Router } from "express";
import * as orders from "./order.services.js";
import { authUser } from "../middleware/authentaction.js";
 import checkTokenRevoked from "../middleware/Check Tokens.js";

const router = Router();   

router.get('/all', authUser, checkTokenRevoked, orders.getUserCheckouts);

export default router;