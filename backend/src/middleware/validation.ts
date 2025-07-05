import { body } from "express-validator";

export const validateVideoUpload = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters"),
  body("cloudinaryVideoUrl")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Cloudinary Video URL is required for video upload"),
  body("cloudinaryVideoId")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Cloudinary Video ID must not be empty if provided"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("cloudinaryThumbnailUrl")
    .optional()
    .isURL()
    .withMessage("Thumbnail must be a valid URL"),
  body("fileSize")
    .optional()
    .isNumeric()
    .withMessage("File size must be a number"),
  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Duration must be a number"),
];

export const validateVideoApproval = [
  body("publishToYoutube")
    .optional()
    .isBoolean()
    .withMessage("publishToYoutube must be a boolean"),
];

export const validateVideoRejection = [
  body("reason")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Rejection reason must be between 1 and 500 characters"),
];

export const validateTeamInvite = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("role")
    .isIn(["creator", "manager", "editor"])
    .withMessage("Valid role is required"),
];

export const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["creator", "editor", "manager"])
    .withMessage("Valid role is required"),
];

export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];
