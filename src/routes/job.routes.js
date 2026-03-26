import express from "express";
import { getJobs, applyJob, getMyApplications,getRecommendedJobs } from "../controller/job.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";
import {upload} from "../middleware/uploadresume.js";
const router = express.Router();

router.get("/", getJobs);
router.post("/apply", verifyToken, upload.single("resume"), applyJob);
router.get("/my-applications", verifyToken, getMyApplications);
router.get("/recommended", verifyToken, getRecommendedJobs);
export default router;