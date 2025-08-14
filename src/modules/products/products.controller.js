import { Router } from "express";
import * as products from "./products.services.js"
import { cloudfileuploader, filevalidation } from "../multer/locaal.multer.js";
import { authUser } from "../middleware/authentaction.js";
import { isAuthorized } from "../middleware/allowed.js";
 import {  validate } from '../middleware/validitor.js';
import {productValidators} from "./products.validation.js";
const router = Router();

  router.post("/create",authUser,isAuthorized(["admin"||"Admin"||"system"]), cloudfileuploader({ validation: filevalidation.Image }).array("Image", 10),
  validate(productValidators.createProduct)  ,products.createproduct)
router.get("/getproducts",products.getAllProducts);
router.get("/getbyid/:id", validate(productValidators.productId), products.getProductById);
router.patch("/update/:id",authUser,isAuthorized(["admin"||"Admin"||"system"]),  validate(productValidators.productId, 'params'),
  validate(productValidators.updateProduct), products.updateProduct);
router.delete("/delete/:id",authUser,isAuthorized(["admin"||"Admin"||"system"]), validate(productValidators.productId, 'params'), products.deleteProduct);
export default router;  