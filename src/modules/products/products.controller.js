import { Router } from "express";
import * as products from "./products.services.js"

const router = Router();
router.get("/getproducts",products.getAllProducts);
router.get("/getbyid/:id", products.getProductById);
router.get("/bycategory/:id", products.productsByCategory);
export default router;  