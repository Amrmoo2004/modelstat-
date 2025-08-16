import { Router } from "express";
import { isAuthorized } from "../middleware/allowed.js";
import { authUser } from "../middleware/authentaction.js";
import { validate } from "../middleware/validitor.js";
import { categoryValidators } from "./category.validators.js";  
import * as category from './category.services.js';
import { cloudfileuploader, filevalidation } from "../multer/locaal.multer.js";
import checkTokenRevoked from "../middleware/Check Tokens.js";

const router = Router();
router.get("/all",validate(categoryValidators.categoryName, 'params'), category.getAllCategories);
router.get("/:id",validate(categoryValidators.categoryId, 'params'), category.getCategoryById);
router.get("/name/:name", category.findCategoryByNameHandler);

export default router; 