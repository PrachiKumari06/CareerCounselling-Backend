import express from "express";
import { getCareerRecommendation, regenerateRecommendation } from "../controller/ai.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router = express.Router();

router.post("/recommendation", verifyToken, getCareerRecommendation);
router.post("/regenerate",verifyToken,regenerateRecommendation)

export default router;