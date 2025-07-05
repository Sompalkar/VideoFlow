import type { Response } from "express";
import { validationResult } from "express-validator";
import VideoComment from "../models/VideoComment";
import Video from "../models/Video";
import type { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import { socketService } from "../services/socket-service";

export class CommentController {
  static async getComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      // Check if user has access to this video
      if (req.user!.teamId?.toString() !== video.teamId.toString()) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const comments = await VideoComment.find({
        videoId,
        parentId: { $exists: false },
      })
        .populate("userId", "name email avatar")
        .populate("mentions", "name email")
        .populate({
          path: "replies",
          populate: {
            path: "userId",
            select: "name email avatar",
          },
        })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await VideoComment.find({ parentId: comment._id })
            .populate("userId", "name email avatar")
            .populate("mentions", "name email")
            .sort({ createdAt: 1 });

          return {
            ...comment.toObject(),
            replies,
          };
        })
      );

      const total = await VideoComment.countDocuments({
        videoId,
        parentId: { $exists: false },
      });

      res.json({
        comments: commentsWithReplies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async addComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(400)
          .json({ message: "Validation errors", errors: errors.array() });
        return;
      }

      const { videoId } = req.params;
      const { content, timestamp, parentId, mentions } = req.body;
      const { userId } = req.user!;

      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      // Check if user has access to this video
      if (req.user!.teamId?.toString() !== video.teamId.toString()) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const comment = new VideoComment({
        videoId,
        userId,
        content,
        timestamp,
        parentId,
        mentions: mentions || [],
      });

      await comment.save();
      await comment.populate("userId", "name email avatar");
      await comment.populate("mentions", "name email");

      // Emit real-time event
      socketService.emitCommentAdded(videoId, comment);

      res.status(201).json({ comment });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const { userId } = req.user!;

      const comment = await VideoComment.findById(commentId);
      if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      if (comment.userId.toString() !== userId) {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save();

      await comment.populate("userId", "name email avatar");

      // Emit real-time event
      socketService.emitCommentUpdated(comment.videoId.toString(), comment);

      res.json({ comment });
    } catch (error) {
      console.error("Update comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { userId, role } = req.user!;

      const comment = await VideoComment.findById(commentId);
      if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      // Only comment owner or team creator can delete
      if (comment.userId.toString() !== userId && role !== "creator") {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      // Delete comment and its replies
      await VideoComment.deleteMany({
        $or: [{ _id: commentId }, { parentId: commentId }],
      });

      // Emit real-time event
      socketService.emitCommentDeleted(comment.videoId.toString(), commentId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async toggleReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { type } = req.body;
      const { userId } = req.user!;

      const comment = await VideoComment.findById(commentId);
      if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      const existingReaction = comment.reactions.find(
        (r) => r.userId.toString() === userId
      );

      if (existingReaction) {
        if (existingReaction.type === type) {
          // Remove reaction
          comment.reactions = comment.reactions.filter(
            (r) => r.userId.toString() !== userId
          );
        } else {
          // Update reaction type
          existingReaction.type = type;
        }
      } else {
        // Add new reaction
        comment.reactions.push({
          userId: new mongoose.Types.ObjectId(userId),
          type,
        });
      }

      await comment.save();
      await comment.populate("userId", "name email avatar");

      // Emit real-time event
      socketService.emitReactionUpdated(
        comment.videoId.toString(),
        comment._id.toString(),
        comment.reactions
      );

      res.json({ comment });
    } catch (error) {
      console.error("Toggle reaction error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
