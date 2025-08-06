import { Router } from "express";

import * as category from './category.services.js';
const router = Router();

router.post("/create", category.createCategory);
router.get("/all", category.getAllCategories);
router.get("/:id", category.getCategoryById);
router.get("/name/:name", category.findCategoryByNameHandler);

router.put("/:id", category.updateCategory);
router.delete("/:id", category.deleteCategory);

export default router; 