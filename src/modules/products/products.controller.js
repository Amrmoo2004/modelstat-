import { Router } from "express";
import * as products from "./products.services.js"

const router = Router();

router.post("/create", products.createproduct)
router.get("/getproducts", products.getAllProducts);
router.get("/getbyid/:id", products.getProductById);
router.patch("/update/:id", products.updateProduct);
router.delete("/delete/:id", products.deleteProduct);
router.post('/uploads/product_images', products.uploadProductImagesbyID);
export default router;  