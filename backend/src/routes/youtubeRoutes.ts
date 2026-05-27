import { Router } from "express";
import type { Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { YoutubeService } from "../services/YoutubeService";
import User from "../models/User";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

// @route   GET /api/youtube/auth-url
// @desc    Get YouTube OAuth URL
// @access  Private (Creator only)
router.get(
  "/auth-url",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const authUrl = await YoutubeService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("YouTube auth URL error:", error);
      res.status(500).json({ message: "Failed to generate YouTube auth URL" });
    }
  }
);

// @route   POST /api/youtube/callback
// @desc    Handle YouTube OAuth callback
// @access  Private (Creator only)
router.post(
  "/callback",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.user!;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ message: "Authorization code is required" });
        return;
      }

      const tokens = await YoutubeService.exchangeCodeForTokens(
        typeof code === "string" ? code : ""
      );

      // Validate tokens before using them
      if (!tokens.accessToken || !tokens.refreshToken) {
        res
          .status(400)
          .json({ message: "Invalid tokens received from YouTube" });
        return;
      }

      // Get channel info to verify connection
      const channelInfo = await YoutubeService.getChannelInfo(tokens);

      // Update user with YouTube tokens and channel info
      await User.findByIdAndUpdate(userId, {
        youtubeTokens: tokens,
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title,
        youtubeChannel: channelInfo,
      });

      res.json({
        success: true,
        message: "YouTube connected successfully",
        channel: channelInfo,
      });
    } catch (error) {
      console.error("YouTube callback error:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect YouTube account",
      });
    }
  }
);

// @route   GET /api/youtube/channel
// @desc    Get YouTube channel info
// @access  Private (Creator only)
router.get(
  "/channel",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user || !user.youtubeTokens) {
        res.status(400).json({ message: "YouTube not connected" });
        return;
      }

      // Validate tokens exist
      if (!user.youtubeTokens.accessToken || !user.youtubeTokens.refreshToken) {
        res
          .status(400)
          .json({ message: "Invalid YouTube tokens, please reconnect" });
        return;
      }

      // First try to get stored channel info
      if (user.youtubeChannel) {
        res.json({ channel: user.youtubeChannel });
        return;
      }

      // If no stored info, fetch from YouTube API
      const channelInfo = await YoutubeService.getChannelInfo({
        accessToken: user.youtubeTokens.accessToken,
        refreshToken: user.youtubeTokens.refreshToken,
        expiresAt: user.youtubeTokens.expiresAt,
      });

      // Store the fetched info for future use
      await User.findByIdAndUpdate(userId, {
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title,
        youtubeChannel: channelInfo,
      });

      res.json({ channel: channelInfo });
    } catch (error) {
      console.error("Get YouTube channel error:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to get channel information",
      });
    }
  }
);

// @route   GET /api/youtube/status
// @desc    Check YouTube connection status
// @access  Private (Creator only)
router.get(
  "/status",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      const isConnected = !!(
        user?.youtubeTokens?.accessToken &&
        user?.youtubeTokens?.refreshToken &&
        user?.youtubeChannelId
      );

      res.json({
        connected: isConnected,
        channelId: user?.youtubeChannelId || null,
        channelName: user?.youtubeChannelName || null,
      });
    } catch (error) {
      console.error("YouTube status error:", error);
      res.status(500).json({ message: "Failed to check YouTube status" });
    }
  }
);

// @route   POST /api/youtube/refresh-channel
// @desc    Refresh YouTube channel info from API
// @access  Private (Creator only)
router.post(
  "/refresh-channel",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user || !user.youtubeTokens) {
        res.status(400).json({ message: "YouTube not connected" });
        return;
      }

      // Validate tokens exist
      if (!user.youtubeTokens.accessToken || !user.youtubeTokens.refreshToken) {
        res
          .status(400)
          .json({ message: "Invalid YouTube tokens, please reconnect" });
        return;
      }

      // Fetch fresh channel info from YouTube API
      const channelInfo = await YoutubeService.getChannelInfo({
        accessToken: user.youtubeTokens.accessToken,
        refreshToken: user.youtubeTokens.refreshToken,
        expiresAt: user.youtubeTokens.expiresAt,
      });

      // Update stored channel info
      await User.findByIdAndUpdate(userId, {
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title,
        youtubeChannel: channelInfo,
      });

      res.json({ channel: channelInfo });
    } catch (error) {
      console.error("Refresh YouTube channel error:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to refresh channel information",
      });
    }
  }
);

// @route   DELETE /api/youtube/disconnect
// @desc    Disconnect YouTube account
// @access  Private (Creator only)
router.delete(
  "/disconnect",
  authenticate,
  authorize(["creator"]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.user!;

      await User.findByIdAndUpdate(userId, {
        $unset: {
          youtubeTokens: 1,
          youtubeChannelId: 1,
          youtubeChannelName: 1,
          youtubeChannel: 1,
        },
      });

      res.json({ success: true, message: "YouTube disconnected successfully" });
    } catch (error) {
      console.error("YouTube disconnect error:", error);
      res.status(500).json({ message: "Failed to disconnect YouTube account" });
    }
  }
);

export default router;
