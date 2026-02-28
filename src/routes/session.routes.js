import express from "express";
import { bookSession,getMySessions,getCounselorSessions,updateSessionStatus } from "../controller/session.controller.js";
import { verifyToken } from "../middleware/verifyToken.middleware.js";

const router = express.Router();

router.post("/book", verifyToken, bookSession);
router.get("/my-sessions", verifyToken, getMySessions);
router.get("/counselor-sessions", verifyToken, getCounselorSessions);
router.put("/update/:id", verifyToken, updateSessionStatus);

export default router;
