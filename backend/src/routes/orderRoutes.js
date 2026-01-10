import express from "express";
import {
  placeOrder,
  getUserOrders,
  getOrderDetails,
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/orderController.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ----------------- PAYMENT ROUTES -----------------

// Create payment order
router.post("/create-payment-order", authMiddleware, createRazorpayOrder);

// Verify payment (optional)
router.post("/verify-payment", authMiddleware, verifyPayment);


// ----------------- EXISTING ORDER ROUTES -----------------

// Place order after payment success
router.post("/", authMiddleware, placeOrder);

// List user orders
router.get("/", authMiddleware, getUserOrders);

// Get single order details
router.get("/:id", authMiddleware, getOrderDetails);

export default router;
