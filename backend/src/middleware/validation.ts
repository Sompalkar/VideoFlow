import { body, param } from "express-validator"

export const validateRegister = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  body("role").optional().isIn(["creator", "editor", "manager"]).withMessage("Invalid role"),
]

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

export const validateVideoUpload = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title is required and must be less than 100 characters"),
  body("description").trim().isLength({ max: 5000 }).withMessage("Description must be less than 5000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("cloudinaryVideoId").notEmpty().withMessage("Cloudinary video ID is required"),
  body("cloudinaryVideoUrl").isURL().withMessage("Valid Cloudinary video URL is required"),
  body("cloudinaryThumbnailUrl").isURL().withMessage("Valid thumbnail URL is required"),
  body("fileSize").isNumeric().withMessage("File size must be a number"),
  body("duration").isNumeric().withMessage("Duration must be a number"),
]

export const validateTeamInvite = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("role").isIn(["creator", "editor", "manager"]).withMessage("Invalid role"),
]

export const validateVideoApproval = [param("id").isMongoId().withMessage("Invalid video ID")]

export const validateVideoRejection = [
  param("id").isMongoId().withMessage("Invalid video ID"),
  body("reason")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Rejection reason is required and must be less than 500 characters"),
]
