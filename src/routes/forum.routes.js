import express from "express";
import {
  createPost,
  getAllPosts,
  getSinglePost,
  addComment,
  upvotePost,
  closePost
} from "../controller/forum.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router = express.Router();

// Get all posts (public)
router.get("/", getAllPosts);

// Get single post
router.get("/:id", getSinglePost);

// Create post (protected)
router.post("/create", verifyToken, createPost);

// Add comment (protected)
router.post("/comment", verifyToken, addComment);

// Upvote (protected)
router.post("/upvote", verifyToken, upvotePost);
router.post("/close", verifyToken, closePost);
export default router;