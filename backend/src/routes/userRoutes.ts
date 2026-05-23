import { Router } from "express"
// import { AuthController } from "@/controllers/AuthController"
import { AuthController } from "../controllers/AuthController"
// import { authenticate } from "@/middleware/auth"
import { authenticate } from "../middleware/auth"

const router = Router()

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", authenticate, AuthController.getProfile)

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticate, AuthController.updateProfile)

export default router
