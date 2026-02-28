import express from "express"
import { signup,login,logout,forgotPassword,updatePassword} from "../controller/auth.controller.js";

const router=express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout",logout)
router.post("/forgot-password", forgotPassword); //optional
router.post("/update-password", updatePassword); //optional


export default router;