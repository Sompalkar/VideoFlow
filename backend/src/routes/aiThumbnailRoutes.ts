import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import { AIThumbnailController } from "../controllers/AIThumbnailController";

const router = express.Router();

// Validation middleware
const validateThumbnailGeneration = [
  body("videoUrl")
    .custom((value) => {
      console.log("Validating videoUrl:", value, typeof value);
      // Allow both URLs and blob URLs
      if (
        typeof value === "string" &&
        (value.startsWith("http") || value.startsWith("blob:"))
      ) {
        return true;
      }
      throw new Error("Valid video URL or blob URL is required");
    })
    .withMessage("Valid video URL is required"),
  body("title")
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title is required (1-100 characters)"),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Description too long"),
  body("style")
    .optional()
    .isIn(["modern", "vintage", "minimal", "bold", "professional"])
    .withMessage("Invalid style"),
  body("colors").optional().isArray().withMessage("Colors must be an array"),
  body("text")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Text too long"),
  body("aspectRatio")
    .optional()
    .isIn(["16:9", "1:1", "4:3"])
    .withMessage("Invalid aspect ratio"),
];

// Custom validation middleware to log errors
const logValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    console.log("Request body:", req.body);
    res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
    return;
  }
  next();
};

const validateThumbnailEnhancement = [
  body("thumbnailUrl").isURL().withMessage("Valid thumbnail URL is required"),
  body("brightness")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Brightness must be between -100 and 100"),
  body("contrast")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Contrast must be between -100 and 100"),
  body("saturation")
    .optional()
    .isFloat({ min: -100, max: 100 })
    .withMessage("Saturation must be between -100 and 100"),
  body("text")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Text too long"),
  body("overlay").optional().isBoolean().withMessage("Overlay must be boolean"),
];

const validateVideoAnalysis = [
  body("videoUrl")
    .custom((value) => {
      // Allow both URLs and blob URLs
      if (
        typeof value === "string" &&
        (value.startsWith("http") || value.startsWith("blob:"))
      ) {
        return true;
      }
      throw new Error("Valid video URL or blob URL is required");
    })
    .withMessage("Valid video URL is required"),
];

// @route   POST /api/ai-thumbnails/generate
// @desc    Generate AI thumbnails for a video
// @access  Private
router.post(
  "/generate",
  authenticate,
  validateThumbnailGeneration,
  logValidationErrors,
  AIThumbnailController.generateThumbnails
);

// @route   POST /api/ai-thumbnails/enhance
// @desc    Enhance an existing thumbnail
// @access  Private
router.post(
  "/enhance",
  authenticate,
  validateThumbnailEnhancement,
  logValidationErrors,
  AIThumbnailController.enhanceThumbnail
);

// @route   POST /api/ai-thumbnails/analyze
// @desc    Analyze video content for thumbnail suggestions
// @access  Private
router.post(
  "/analyze",
  authenticate,
  validateVideoAnalysis,
  logValidationErrors,
  AIThumbnailController.analyzeVideo
);

// @route   GET /api/ai-thumbnails/styles
// @desc    Get available thumbnail styles
// @access  Private
router.get("/styles", authenticate, AIThumbnailController.getThumbnailStyles);

export default router;
