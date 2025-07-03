import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import Video from "../models/Video";
import User from "../models/User";
import { YoutubeService } from "../services/YoutubeService";
import { CloudinaryService } from "../services/CloudinaryService";
import type { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import Team from "../models/Team";
import { EmailService } from "../services/EmailService";

export class VideoController {
  static async getVideos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, teamId } = req.user!;

      if (!teamId) {
        res.status(400).json({ message: "User not part of any team" });
        return;
      }

      const videos = await Video.find({ teamId })
        .populate("uploadedBy", "name email avatar")
        .populate("approvedBy", "name email")
        .populate("rejectedBy", "name email")
        .sort({ createdAt: -1 });

      const formattedVideos = videos.map((video) => ({
        id: video._id,
        title: video.title,
        description: video.description,
        tags: video.tags,
        thumbnail: video.cloudinaryThumbnailUrl || video.thumbnail,
        status: video.status,
        uploadedBy: video.uploadedBy,
        uploadedAt: video.uploadedAt,
        approvedBy: video.approvedBy,
        approvedAt: video.approvedAt,
        rejectedBy: video.rejectedBy,
        rejectedAt: video.rejectedAt,
        rejectionReason: video.rejectionReason,
        youtubeId: video.youtubeId,
        youtubeUrl: video.youtubeUrl,
        fileSize: video.fileSize,
        duration: video.duration,
        cloudinaryVideoUrl: video.cloudinaryVideoUrl,
        cloudinaryThumbnailUrl: video.cloudinaryThumbnailUrl,
        category: video.category,
        privacy: video.privacy,
        teamId: video.teamId,
      }));

      res.json({ videos: formattedVideos });
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async uploadVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(400)
          .json({ message: "Validation errors", errors: errors.array() });
        return;
      }

      const { userId, teamId } = req.user!;

      if (!teamId) {
        res.status(400).json({ message: "User not part of any team" });
        return;
      }

      const {
        title,
        description,
        tags,
        cloudinaryVideoId,
        cloudinaryVideoUrl,
        cloudinaryThumbnailId,
        cloudinaryThumbnailUrl,
        fileSize,
        duration,
        category = "22",
        privacy = "private",
      } = req.body;

      const video = new Video({
        title,
        description,
        tags: Array.isArray(tags) ? tags : [],
        thumbnail: cloudinaryThumbnailUrl,
        cloudinaryVideoId,
        cloudinaryVideoUrl,
        cloudinaryThumbnailId,
        cloudinaryThumbnailUrl,
        fileSize,
        duration,
        category,
        privacy,
        uploadedBy: userId,
        teamId,
        status: "pending",
      });

      await video.save();
      await video.populate("uploadedBy", "name email avatar");

      // Notify all team members except uploader
      const team = await Team.findById(teamId).populate(
        "members.userId",
        "email name"
      );
      if (team) {
        const uploaderId = req.user!.userId;
        // Defensive: uploadedBy may be ObjectId or User
        const uploaderName =
          video.uploadedBy &&
          typeof video.uploadedBy === "object" &&
          "name" in video.uploadedBy
            ? (video.uploadedBy as any).name
            : "";
        const teamName = team.name;
        for (const member of team.members) {
          // Defensive: member.userId may be ObjectId or User
          const memberUser = member.userId as any;
          if (
            memberUser &&
            memberUser._id &&
            memberUser._id.toString() !== uploaderId &&
            memberUser.email
          ) {
            await EmailService.sendVideoUploadNotification(memberUser.email, {
              videoTitle: video.title,
              uploaderName,
              teamName,
              videoUrl: undefined, // Optionally add a link to the video in your frontend
            });
          }
        }
      }

      res.status(201).json({
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          tags: video.tags,
          thumbnail: video.cloudinaryThumbnailUrl,
          status: video.status,
          uploadedBy: video.uploadedBy,
          uploadedAt: video.uploadedAt,
          fileSize: video.fileSize,
          duration: video.duration,
          cloudinaryVideoUrl: video.cloudinaryVideoUrl,
          cloudinaryThumbnailUrl: video.cloudinaryThumbnailUrl,
          category: video.category,
          privacy: video.privacy,
          teamId: video.teamId,
        },
      });
    } catch (error) {
      console.error("Upload video error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async approveVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { id } = req.params;

      // Only creators can approve videos
      if (role !== "creator") {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      if (video.status !== "pending") {
        res.status(400).json({ message: "Video is not pending approval" });
        return;
      }

      // Update video status
      video.status = "approved";
      video.approvedBy = new mongoose.Types.ObjectId(userId);
      video.approvedAt = new Date();
      await video.save();

      // Notify all team members except creator
      const team = await Team.findById(video.teamId).populate(
        "members.userId",
        "email name"
      );
      if (team) {
        const creator = await User.findOne({
          teamId: team._id,
          role: "creator",
        });
        const approver = await User.findById(userId);
        for (const member of team.members) {
          const memberUser = member.userId as any;
          if (
            memberUser &&
            memberUser._id &&
            (!creator ||
              memberUser._id.toString() !== creator._id.toString()) &&
            memberUser.email
          ) {
            await EmailService.sendVideoApprovalNotification(memberUser.email, {
              videoTitle: video.title,
              approverName: approver?.name || "A team member",
              youtubeUrl: undefined,
            });
          }
        }
      }

      // Get the team owner's YouTube tokens
      const teamOwner = await User.findOne({
        teamId: video.teamId,
        role: "creator",
      });

      if (!teamOwner || !teamOwner.youtubeTokens) {
        res
          .status(400)
          .json({ message: "YouTube not connected for this team" });
        return;
      }

      // Always attempt to upload to YouTube on approval
      let youtubeResult = null;
      try {
        youtubeResult = await YoutubeService.uploadVideoFromCloudinary(
          teamOwner._id.toString(),
          {
            title: video.title,
            description: video.description,
            tags: video.tags,
            categoryId: video.category,
            privacyStatus: video.privacy as "private" | "public" | "unlisted",
          },
          video.cloudinaryVideoId
        );
        // Update video with YouTube info only if upload succeeded
        if (youtubeResult && youtubeResult.id) {
          video.youtubeId = youtubeResult.id;
          video.youtubeUrl = `https://www.youtube.com/watch?v=${youtubeResult.id}`;
          video.status = "published";
          await video.save();

          // Notify all team members except uploader
          if (team) {
            // Defensive: uploadedBy may be ObjectId or User
            const uploaderId =
              video.uploadedBy &&
              typeof video.uploadedBy === "object" &&
              "_id" in video.uploadedBy
                ? (video.uploadedBy as any)._id.toString()
                : "";
            const uploaderName =
              video.uploadedBy &&
              typeof video.uploadedBy === "object" &&
              "name" in video.uploadedBy
                ? (video.uploadedBy as any).name
                : "";
            for (const member of team.members) {
              const memberUser = member.userId as any;
              if (
                memberUser &&
                memberUser._id &&
                memberUser._id.toString() !== uploaderId &&
                memberUser.email
              ) {
                await EmailService.sendVideoPublishedNotification(
                  memberUser.email,
                  {
                    videoTitle: video.title,
                    uploaderName,
                    youtubeUrl: video.youtubeUrl,
                    teamName: team.name,
                  }
                );
              }
            }
          }
        }
      } catch (youtubeError) {
        // Do not set status to published if upload fails
        console.error("YouTube upload failed:", youtubeError);
        // Keep video as approved so user can retry
      }

      await video.populate([
        { path: "uploadedBy", select: "name email avatar" },
        { path: "approvedBy", select: "name email" },
      ]);

      res.json({
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          tags: video.tags,
          thumbnail: video.cloudinaryThumbnailUrl,
          status: video.status,
          uploadedBy: video.uploadedBy,
          uploadedAt: video.uploadedAt,
          approvedBy: video.approvedBy,
          approvedAt: video.approvedAt,
          youtubeId: video.youtubeId,
          youtubeUrl: video.youtubeUrl,
          fileSize: video.fileSize,
          duration: video.duration,
          cloudinaryVideoUrl: video.cloudinaryVideoUrl,
          cloudinaryThumbnailUrl: video.cloudinaryThumbnailUrl,
          category: video.category,
          privacy: video.privacy,
          teamId: video.teamId,
        },
      });
    } catch (error) {
      console.error("Approve video error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async rejectVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { id } = req.params;
      const { reason } = req.body;

      // Only creators can reject videos
      if (role !== "creator") {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      if (!reason) {
        res.status(400).json({ message: "Rejection reason is required" });
        return;
      }

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      if (video.status !== "pending") {
        res.status(400).json({ message: "Video is not pending approval" });
        return;
      }

      // Update video status
      video.status = "rejected";
      video.rejectedBy = new mongoose.Types.ObjectId(userId);
      video.rejectedAt = new Date();
      video.rejectionReason = reason;
      await video.save();

      await video.populate([
        { path: "uploadedBy", select: "name email avatar" },
        { path: "rejectedBy", select: "name email" },
      ]);

      res.json({
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          tags: video.tags,
          thumbnail: video.cloudinaryThumbnailUrl,
          status: video.status,
          uploadedBy: video.uploadedBy,
          uploadedAt: video.uploadedAt,
          rejectedBy: video.rejectedBy,
          rejectedAt: video.rejectedAt,
          rejectionReason: video.rejectionReason,
          fileSize: video.fileSize,
          duration: video.duration,
          cloudinaryVideoUrl: video.cloudinaryVideoUrl,
          cloudinaryThumbnailUrl: video.cloudinaryThumbnailUrl,
          category: video.category,
          privacy: video.privacy,
          teamId: video.teamId,
        },
      });
    } catch (error) {
      console.error("Reject video error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const { id } = req.params;

      const video = await Video.findById(id);
      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      // Check if user has permission to delete
      if (video.uploadedBy.toString() !== userId && role !== "creator") {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      // Delete from Cloudinary
      if (video.cloudinaryVideoId) {
        await CloudinaryService.deleteResource(
          video.cloudinaryVideoId,
          "video"
        );
      }
      if (video.cloudinaryThumbnailId) {
        await CloudinaryService.deleteResource(
          video.cloudinaryThumbnailId,
          "image"
        );
      }

      await Video.findByIdAndDelete(id);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getVideoById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, teamId } = req.user!;
      const { id } = req.params;

      const video = await Video.findById(id)
        .populate("uploadedBy", "name email avatar")
        .populate("approvedBy", "name email")
        .populate("rejectedBy", "name email");

      if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
      }

      // Check if user has access to this video
      if (teamId?.toString() !== video.teamId.toString()) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      res.json({
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          tags: video.tags,
          thumbnail: video.cloudinaryThumbnailUrl,
          status: video.status,
          uploadedBy: video.uploadedBy,
          uploadedAt: video.uploadedAt,
          approvedBy: video.approvedBy,
          approvedAt: video.approvedAt,
          rejectedBy: video.rejectedBy,
          rejectedAt: video.rejectedAt,
          rejectionReason: video.rejectionReason,
          youtubeId: video.youtubeId,
          youtubeUrl: video.youtubeUrl,
          fileSize: video.fileSize,
          duration: video.duration,
          cloudinaryVideoUrl: video.cloudinaryVideoUrl,
          cloudinaryThumbnailUrl: video.cloudinaryThumbnailUrl,
          category: video.category,
          privacy: video.privacy,
          teamId: video.teamId,
        },
      });
    } catch (error) {
      console.error("Get video by ID error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
