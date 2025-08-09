import { Router } from "express";
import * as products from "./products.services.js"
import { cloudfileuploader, filevalidation } from "../multer/locaal.multer.js";
import { authUser } from "../middleware/authentaction.js";
import { isAuthorized } from "../middleware/allowed.js";
const router = Router();

router.post("/create",authUser,isAuthorized(["admin"]), cloudfileuploader({ validation: filevalidation.Image }).array("Image", 10),
  products.createproduct)
router.get("/getproducts",products.getAllProducts);
router.get("/getbyid/:id", products.getProductById);
router.patch("/update/:id",authUser,isAuthorized(["admin"]), products.updateProduct);
router.delete("/delete/:id",authUser,isAuthorized(["admin"]), products.deleteProduct);
export default router;  