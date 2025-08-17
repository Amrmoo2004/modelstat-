import { Router } from "express";
import { isAuthorized } from "../middleware/allowed.js";
import { authUser } from "../middleware/authentaction.js";
import { categoryValidators } from "../category/category.validators.js";  
import { cloudfileuploader, filevalidation } from "../multer/locaal.multer.js";
import checkTokenRevoked from "../middleware/Check Tokens.js";
import * as category from '../category/category.services.js';
import validate from "../middleware/validitor.js";
import * as products from "../products/products.services.js";
import { productValidators } from "../products/products.validation.js"
import*as user from "../user/user.services.js"


const router = Router();
//admin_category
router.post("/create_category",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]),validate(categoryValidators.createCategory),cloudfileuploader({ validation: filevalidation.Image }).single('icon'||'Icon'), category.createCategory);
router.patch("/update_category/",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]),
  validate(categoryValidators.updateCategory),
 category.updateCategory);
 router.delete("/delete_category/",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]), category.deleteCategory);

//product_admin
router.post("/create_products",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]), cloudfileuploader({ validation: filevalidation.Image }).array("Image"||"image", 10),
  validate(productValidators.createProduct)  ,products.createproduct)
router.patch("/update_products/",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]),cloudfileuploader({ validation: filevalidation.Image }).array("Image"||"image", 10),
  validate(productValidators.updateProduct), products.updateProduct);
router.delete("/delete_products/",checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]), products.deleteProduct);
//user_admin
router.post('/update_userrole/',user.update_userrole)
router.get('/get_users/',checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]),user.get_users)
router.delete('/delete_user/',checkTokenRevoked,authUser,isAuthorized(["admin"||"Admin"||"system"]),validate(user.userId, 'params'),user.deleteuser)


export default router;