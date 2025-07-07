import express from "express";
import { generateFrameBasedThumbnails } from "../controllers/FrameThumbnailController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Generate frame-based thumbnails
router.post("/generate", authenticate, generateFrameBasedThumbnails);

export default router;
