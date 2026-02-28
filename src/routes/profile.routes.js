import express from "express"
import  {createCareerProfile,updateCareerProfile,getCareerProfile,getAllCounselors,matchCounselors} from "../controller/profile.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router=express.Router()
router.post("/career-profile",verifyToken, createCareerProfile);
router.put("/career-profile", verifyToken, updateCareerProfile);
router.get("/career-profile", verifyToken, getCareerProfile);
router.get("/counselors", verifyToken, getAllCounselors);
router.get("/match-counselors", verifyToken, matchCounselors);  // optional: match counselors based on skills/interests but filter on frontend for simplicity is doing so can be ignre this part if you want to save time and focus on frontend

export default router;