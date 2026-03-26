import express from "express";
import {
  addFeedback,
  getFeedback,
  getRatingSummary,
  toggleLike
} from "../controller/feedback.controller.js";

import {verifyToken} from "../middleware/verifyToken.middleware.js";

const router = express.Router();

router.post("/", verifyToken, addFeedback);
router.get("/:counselorId", getFeedback);
router.get("/summary/:counselorId", getRatingSummary);
router.post("/like", verifyToken,toggleLike);
export default router;