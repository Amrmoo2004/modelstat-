import { Router } from "express";
import { isAuthorized } from "../middleware/allowed.js";
import { authUser } from "../middleware/authentaction.js";
import * as category from './category.services.js';
const router = Router();
router.post("/create",authUser,isAuthorized(["admin"]), category.createCategory);
router.get("/all", category.getAllCategories);
router.get("/:id", category.getCategoryById);
router.get("/name/:name", category.findCategoryByNameHandler);

router.put("/:id",authUser,isAuthorized(["admin"]), category.updateCategory);
router.delete("/:id",authUser,isAuthorized(["admin"]), category.deleteCategory);

export default router; 