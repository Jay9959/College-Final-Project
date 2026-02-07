import express from "express";
import forgotPassword from "../controllers/forgotPassword.controller.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);

export default router;
