import { Router } from "express";
import { isAuthorized } from "../middleware/allowed.js";
import { authUser } from "../middleware/authentaction.js";
import { validate } from "../middleware/validitor.js";
import { categoryValidators } from "./category.validators.js";
import * as category from './category.services.js';
const router = Router();
router.post("/create",authUser,isAuthorized(["admin"||"Admin"||"system"]),validate(categoryValidators.createCategory), category.createCategory);
router.get("/all",validate(categoryValidators.categoryName, 'params'), category.getAllCategories);
router.get("/:id",validate(categoryValidators.categoryId, 'params'), category.getCategoryById);
router.get("/name/:name", category.findCategoryByNameHandler);

router.patch("/:id",authUser,isAuthorized(["admin"||"Admin"||"system"]),
  validate(categoryValidators.updateCategory),
 category.updateCategory);
router.delete("/:id", validate(categoryValidators.categoryId, 'params'),authUser,isAuthorized(["admin"||"Admin"||"system"]), category.deleteCategory);

export default router; 