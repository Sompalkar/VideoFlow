import type { Response } from "express";
import { validationResult } from "express-validator";
import VideoComment from "../models/VideoComment";
import Video from "../models/Video";
import type { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

export class CommentController {
  static async testComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      /* console log removed */

      // Test database connection
      const commentCount = await VideoComment.countDocuments();
      /* console log removed */

      // Test finding a comment
      const sampleComment = await VideoComment.findOne();
      /* console log removed */

      res.json({
        message: "Comment controller is working",
        totalComments: commentCount,
        sampleComment: sampleComment ? "Found" : "None",
      });
    } catch (error) {
      /* console log removed */
      res.status(500).json({
        message: "Test failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  static async getComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const { page = 1, limit = 50 } = req.query; // Increased default limit for infinite scroll

      /* console log removed */
      /* console log removed */

      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      /* console log removed */

      // Check if user has access to this video
      if (req.user!.teamId?.toString() !== video.teamId.toString()) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Debug: Check all comments in database
      const allComments = await VideoComment.find({});
      /* console log removed */

      // Find comments that match this videoId (handle both string and ObjectId types)
      const matchingComments = allComments.filter((comment) => {
        const commentVideoId = comment.videoId.toString();
        const queryVideoId = videoId.toString();
        return commentVideoId === queryVideoId;
      });

      /* console log removed */

      // Filter for main comments (no parentId)
      const mainComments = matchingComments.filter(
        (comment) => !comment.parentId
      );
      /* console log removed */

      // Sort by creation date (oldest first)
      mainComments.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      // For infinite scroll, we'll return all comments but still support pagination
      // Apply pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedComments = mainComments.slice(startIndex, endIndex);

      // Populate user data for each comment
      const populatedComments = await Promise.all(
        paginatedComments.map(async (comment) => {
          await comment.populate("userId", "name email avatar");
          await comment.populate("mentions", "name email");

          // Get replies for this comment
          const replies = await VideoComment.find({
            parentId: comment._id.toString(),
          }).populate("userId", "name email avatar");

          return {
            ...comment.toObject(),
            replies: replies.sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            ),
          };
        })
      );

      /* console log removed */

      res.json({
        comments: populatedComments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mainComments.length,
          pages: Math.ceil(mainComments.length / Number(limit)),
          hasMore: endIndex < mainComments.length,
        },
      });
    } catch (error) {
      /* console log removed */
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

      /* console log removed */
      /* console log removed */
      /* console log removed */
      /* console log removed */
      /* console log removed */

      const video = await Video.findById(videoId);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      /* console log removed */

      // Check if user has access to this video
      if (req.user!.teamId?.toString() !== video.teamId.toString()) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Create comment with videoId as string to match existing data
      const comment = new VideoComment({
        videoId: videoId, // Store as string to match existing comments
        userId,
        content,
        timestamp,
        parentId,
        mentions: mentions || [],
      });

      /* console log removed */

      await comment.save();
      /* console log removed */

      // Populate the comment with user data
      await comment.populate("userId", "name email avatar");
      await comment.populate("mentions", "name email");

      // Convert to plain object for response
      const commentData = comment.toObject();
      /* console log removed */
      /* console log removed */

      res.status(201).json({ comment: commentData });
    } catch (error) {
      /* console log removed */
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

      comment.content = typeof content === "string" ? content : "";
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save();

      await comment.populate("userId", "name email avatar");

      res.json({ comment });
    } catch (error) {
      /* console log removed */
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

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      /* console log removed */
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

      // Validate reaction type
      const validTypes = ["like", "dislike", "heart", "laugh"];
      if (typeof type !== "string" || !validTypes.includes(type)) {
        res.status(400).json({ message: "Invalid reaction type" });
        return;
      }

      const existingReactionIndex = comment.reactions.findIndex(
        (reaction) => reaction.userId.toString() === userId
      );

      if (existingReactionIndex > -1) {
        // Remove existing reaction
        comment.reactions.splice(existingReactionIndex, 1);
      } else {
        // Add new reaction
        comment.reactions.push({
          userId: new mongoose.Types.ObjectId(userId),
          type: type as "like" | "dislike" | "heart" | "laugh",
        });
      }

      await comment.save();
      await comment.populate("userId", "name email avatar");

      res.json({ comment });
    } catch (error) {
      /* console log removed */
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
