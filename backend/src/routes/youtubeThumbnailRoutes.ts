import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import {
  generateYouTubeStyleThumbnails,
  getAvailableStyles,
  getStyleDetails,
} from "../controllers/YouTubeThumbnailController";

const router = express.Router();

// Validation middleware
const validateThumbnailGeneration = [
  body("title")
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title is required and must be between 1-100 characters"),
  body("subtitle")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Subtitle must be less than 100 characters"),
  body("style")
    .optional()
    .isString()
    .isIn([
      "cool-energy",
      "professional-impact",
      "high-energy",
      "minimalist",
      "cinematic",
      "face-reaction",
      "bold-overlay",
      "viral-kids",
    ])
    .withMessage("Invalid style selected"),
  body("aspectRatio")
    .optional()
    .isString()
    .isIn(["16:9", "9:16", "1:1"])
    .withMessage("Invalid aspect ratio"),
  body("quality")
    .optional()
    .isString()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid quality setting"),
  body("variations")
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage("Variations must be between 1-6"),
  body("platform")
    .optional()
    .isString()
    .isIn(["youtube", "instagram", "facebook", "tiktok"])
    .withMessage("Invalid platform"),
  body("baseImage")
    .optional()
    .isURL()
    .withMessage("Base image must be a valid URL"),
  body("videoUrl")
    .optional()
    .isURL()
    .withMessage("Video URL must be a valid URL"),
  body("customColors.textColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Text color must be a valid hex color"),
  body("customColors.backgroundColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Background color must be a valid hex color"),
  body("customColors.accentColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Accent color must be a valid hex color"),
  body("effects.brightness")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Brightness must be between -100 and 100"),
  body("effects.contrast")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Contrast must be between -100 and 100"),
  body("effects.saturation")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Saturation must be between -100 and 100"),
  body("effects.blur")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Blur must be between 0 and 100"),
];

// Generate YouTube-style thumbnails
router.post(
  "/generate",
  authenticate,
  validateThumbnailGeneration,
  generateYouTubeStyleThumbnails
);

// Get available styles
router.get("/styles", authenticate, getAvailableStyles);

// Get specific style details
router.get("/styles/:styleName", authenticate, getStyleDetails);

export default router;
