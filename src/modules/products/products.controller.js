import { Router } from "express";
import * as products from "./products.services.js"
import { cloudfileuploader, filevalidation } from "../multer/locaal.multer.js";
 import {  validate } from '../middleware/validitor.js';
import {productValidators} from "./products.validation.js";

const router = Router();
router.get("/getproducts",products.getAllProducts);
router.get("/getbyid/:id", products.getProductById);
export default router;  