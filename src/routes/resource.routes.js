import express from "express";
import {
  createResource,
  getAllResources,
  getSingleResource
} from "../controller/resource.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router = express.Router();

// Public
router.get("/", getAllResources);
router.get("/:id", getSingleResource);

// Only Counselor
router.post("/create", verifyToken, createResource);

export default router;