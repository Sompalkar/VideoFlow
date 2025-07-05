import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middleware/auth";
import {
  validateUserRegistration,
  validateUserLogin,
} from "../middleware/validation";

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateUserRegistration, AuthController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateUserLogin, AuthController.login);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", authenticate, AuthController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticate, AuthController.updateProfile);

// @route   POST /api/auth/refresh
// @desc    Refresh user token with updated team role
// @access  Private
router.post("/refresh", authenticate, AuthController.refreshToken);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post("/change-password", authenticate, AuthController.changePassword);

export default router;
