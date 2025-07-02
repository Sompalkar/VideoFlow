import { Router } from "express"
// import { VideoController } from "@/controllers/VideoController"
import { VideoController } from "../controllers/VideoController"
// import { authenticate, authorize } from "@/middleware/auth"
import { authenticate, authorize } from "../middleware/auth"
// import { validateVideoUpload, validateVideoApproval, validateVideoRejection } from "@/middleware/validation"
import { validateVideoUpload, validateVideoApproval,validateVideoRejection } from "../middleware/validation"

const router = Router()

// @route   GET /api/videos
// @desc    Get all videos for user's team
// @access  Private
router.get("/", authenticate, VideoController.getVideos)

// @route   POST /api/videos/upload
// @desc    Upload a new video
// @access  Private
router.post("/upload", authenticate, validateVideoUpload, VideoController.uploadVideo)

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get("/:id", authenticate, VideoController.getVideoById)

// @route   POST /api/videos/:id/approve
// @desc    Approve a video
// @access  Private (Creator only)
router.post("/:id/approve", authenticate, authorize(["creator"]), validateVideoApproval, VideoController.approveVideo)

// @route   POST /api/videos/:id/reject
// @desc    Reject a video
// @access  Private (Creator only)
router.post("/:id/reject", authenticate, authorize(["creator"]), validateVideoRejection, VideoController.rejectVideo)

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete("/:id", authenticate, VideoController.deleteVideo)

export default router
