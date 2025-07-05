import { Router } from "express"
import { CommentController } from "../controllers/CommentController"
import { authenticate } from "../middleware/auth"
import { body } from "express-validator"

const router = Router()

// All routes require authentication
router.use(authenticate)

const validateComment = [
  body("content").trim().isLength({ min: 1, max: 1000 }).withMessage("Content must be between 1 and 1000 characters"),
  body("timestamp").optional().isNumeric().withMessage("Timestamp must be a number"),
]

// GET /api/comments/:videoId - Get comments for a video
router.get("/:videoId", CommentController.getComments)

// POST /api/comments/:videoId - Add comment to a video
router.post("/:videoId", validateComment, CommentController.addComment)

// PUT /api/comments/:commentId - Update a comment
router.put("/:commentId", validateComment, CommentController.updateComment)

// DELETE /api/comments/:commentId - Delete a comment
router.delete("/:commentId", CommentController.deleteComment)

// POST /api/comments/:commentId/reaction - Toggle reaction on comment
router.post(
  "/:commentId/reaction",
  body("type").isIn(["like", "dislike", "heart", "laugh"]),
  CommentController.toggleReaction,
)

export default router
