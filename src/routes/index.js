import express from "express";
import healthRouter from "./health.js";
import apiRouter from "./api.js";
import authRouter from "./auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", (req, res) => {
  res.render("landing");
});

// Auth routes (login, register, logout)
router.use("/", authRouter);

// Protected routes
router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    username: req.session.username
  });
});

// Mount route groups
router.use("/health", healthRouter);
router.use("/api", apiRouter);

export default router;
