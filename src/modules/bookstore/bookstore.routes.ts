import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as controller from "./bookstore.controller.js";

const router = Router();

// Require admin for all bookstore routes
router.use(requireAdmin);

// Authors
router.get("/authors", asyncHandler(controller.listAuthors));
router.post("/authors", asyncHandler(controller.addAuthor));
router.patch("/authors/:id", asyncHandler(controller.editAuthor));
router.delete("/authors/:id", asyncHandler(controller.removeAuthor));

// Books
router.get("/books", asyncHandler(controller.listBooks));
router.post("/books", asyncHandler(controller.addBook));
router.patch("/books/:id", asyncHandler(controller.editBook));
router.delete("/books/:id", asyncHandler(controller.removeBook));

// Orders
router.get("/orders", asyncHandler(controller.listOrders));
router.patch("/orders/:id/status", asyncHandler(controller.changeOrderStatus));

export const bookstoreRouter = router;
