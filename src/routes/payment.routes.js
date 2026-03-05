import express from "express";
import { verifyPayment } from "../controller/payment.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router = express.Router();

router.post("/verify", verifyToken, verifyPayment);

export default router;