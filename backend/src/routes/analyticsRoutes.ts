import { Router } from "express"
import type { Response } from "express"
// import { authenticate } from "@/middleware/auth"
// import { authenticate } from "@/middleware/auth"
import {authenticate} from '../middleware/auth'
// import Video from "@/models/Video"
import Video from "../models/Video"
// import type { AuthRequest } from "@/middleware/auth"
import type { AuthRequest } from "../middleware/auth"

const router = Router()

// @route   GET /api/analytics
// @desc    Get analytics data
// @access  Private
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, teamId } = req.user!

    if (!teamId) {
      res.status(400).json({ message: "User not part of any team" })
      return
    }

    // Get video statistics
    const videos = await Video.find({ teamId })
    const publishedVideos = videos.filter((v) => v.status === "published")

    // Mock analytics data (in production, integrate with YouTube Analytics API)
    const analytics = {
      totalViews: publishedVideos.length * Math.floor(Math.random() * 10000) + 1000,
      totalLikes: publishedVideos.length * Math.floor(Math.random() * 500) + 50,
      totalComments: publishedVideos.length * Math.floor(Math.random() * 100) + 10,
      avgWatchTime: "3:45",
      viewsGrowth: Math.floor(Math.random() * 50) + 5,
      likesGrowth: Math.floor(Math.random() * 30) + 2,
      commentsGrowth: Math.floor(Math.random() * 20) + 1,
      watchTimeGrowth: Math.floor(Math.random() * 15) + 3,
      topVideos: publishedVideos.slice(0, 5).map((video) => ({
        id: video._id,
        title: video.title,
        views: Math.floor(Math.random() * 50000) + 1000,
        likes: Math.floor(Math.random() * 2000) + 100,
        publishedAt: video.approvedAt || video.createdAt,
      })),
      recentActivity: videos.slice(0, 10).map((video) => ({
        id: video._id,
        type:
          video.status === "published"
            ? "publish"
            : video.status === "approved"
              ? "approval"
              : video.status === "rejected"
                ? "rejection"
                : "upload",
        message: `Video "${video.title}" was ${video.status}`,
        timestamp: video.updatedAt,
        user: video.uploadedBy,
      })),
    }

    res.json({ analytics })
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({ message: "Failed to fetch analytics" })
  }
})

export default router
