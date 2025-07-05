import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import { CloudinaryService } from "./CloudinaryService";
import { Readable } from "stream";

const youtube = google.youtube("v3");

interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
}

interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

// Map internal category names to YouTube category IDs
const CATEGORY_MAP: Record<string, string> = {
  entertainment: "24",
  music: "10",
  gaming: "20",
  education: "27",
  news: "25",
  sports: "17",
  technology: "28",
  lifestyle: "22",
  people: "22",
  blogs: "22",
};

function getYoutubeCategoryId(category: string | undefined): string {
  if (!category) return "22";
  return CATEGORY_MAP[category.toLowerCase()] || "22";
}

export class YoutubeService {
  private static getOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
  }

  static getAuthUrl(): string {
    const oauth2Client = this.getOAuth2Client();

    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    return url;
  }

  static async exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
    try {
      const oauth2Client = this.getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Invalid tokens received from YouTube");
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      };
    } catch (error) {
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange code for tokens");
    }
  }

  static async getChannelInfo(tokens: YouTubeTokens): Promise<ChannelInfo> {
    try {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const response = await youtube.channels.list({
        auth: oauth2Client,
        part: ["snippet", "statistics"],
        mine: true,
      });

      const channel = response.data.items?.[0];
      if (!channel) {
        throw new Error("No YouTube channel found");
      }

      return {
        id: channel.id || "",
        title: channel.snippet?.title || "",
        description: channel.snippet?.description || "",
        thumbnail: channel.snippet?.thumbnails?.default?.url || "",
        subscriberCount: Number.parseInt(
          channel.statistics?.subscriberCount || "0"
        ),
        videoCount: Number.parseInt(channel.statistics?.videoCount || "0"),
        viewCount: Number.parseInt(channel.statistics?.viewCount || "0"),
      };
    } catch (error) {
      console.error("Get channel info error:", error);
      throw new Error("Failed to get channel information");
    }
  }

  static async handleCallback(code: string, userId: string): Promise<void> {
    try {
      const tokens = await this.exchangeCodeForTokens(code);
      const channelInfo = await this.getChannelInfo(tokens);

      // Update user with tokens and channel info
      await User.findByIdAndUpdate(userId, {
        youtubeTokens: tokens,
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title,
        youtubeChannel: channelInfo,
      });
    } catch (error) {
      console.error("YouTube callback error:", error);
      throw new Error("Failed to connect YouTube account");
    }
  }

  static async disconnectAccount(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: {
          youtubeTokens: 1,
          youtubeChannelId: 1,
          youtubeChannelName: 1,
          youtubeChannel: 1,
        },
      });
    } catch (error) {
      console.error("YouTube disconnect error:", error);
      throw new Error("Failed to disconnect YouTube account");
    }
  }

  static async uploadVideo(
    userId: string,
    videoData: {
      title: string;
      description: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: "private" | "public" | "unlisted";
    },
    cloudinaryPublicId: string
  ): Promise<{
    id: string;
    url: string;
    title?: string;
    description?: string;
  }> {
    try {
      const user = await User.findById(userId);
      if (!user?.youtubeTokens) {
        throw new Error("YouTube not connected");
      }

      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.youtubeTokens.accessToken,
        refresh_token: user.youtubeTokens.refreshToken,
      });

      // Use direct, secure Cloudinary video URL
      const videoUrl = CloudinaryService.getVideoUrl(cloudinaryPublicId);

      // Download video temporarily for upload
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch video from Cloudinary");
      }

      const videoBuffer = await response.arrayBuffer();
      // Use a Readable stream for YouTube upload
      const videoStream = Readable.from(Buffer.from(videoBuffer));

      const uploadResponse = await youtube.videos.insert({
        auth: oauth2Client,
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: videoData.title,
            description: videoData.description,
            tags: videoData.tags,
            categoryId: getYoutubeCategoryId(videoData.categoryId),
          },
          status: {
            privacyStatus: videoData.privacyStatus || "private",
          },
        },
        media: {
          body: videoStream,
        },
      });

      const videoId = uploadResponse.data.id;
      if (!videoId) {
        throw new Error("No video ID returned from YouTube");
      }

      return {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: uploadResponse.data.snippet?.title || undefined,
        description: uploadResponse.data.snippet?.description || undefined,
      };
    } catch (error) {
      console.error("YouTube upload error:", error);
      throw new Error("Failed to upload video to YouTube");
    }
  }

  static async uploadVideoFromCloudinary(
    userId: string,
    videoData: {
      title: string;
      description: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: "private" | "public" | "unlisted";
    },
    cloudinaryPublicId: string
  ): Promise<{
    id: string;
    url: string;
    title?: string;
    description?: string;
  }> {
    return this.uploadVideo(userId, videoData, cloudinaryPublicId);
  }

  static async getVideos(userId: string): Promise<any[]> {
    try {
      const user = await User.findById(userId);
      if (!user?.youtubeTokens) {
        throw new Error("YouTube not connected");
      }

      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.youtubeTokens.accessToken,
        refresh_token: user.youtubeTokens.refreshToken,
      });

      const response = await youtube.search.list({
        auth: oauth2Client,
        part: ["snippet"],
        forMine: true,
        type: ["video"],
        maxResults: 50,
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Get videos error:", error);
      throw new Error("Failed to get YouTube videos");
    }
  }

  static async refreshTokens(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user?.youtubeTokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: user.youtubeTokens.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      await User.findByIdAndUpdate(userId, {
        "youtubeTokens.accessToken": credentials.access_token,
        "youtubeTokens.expiresAt": credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      throw new Error("Failed to refresh YouTube tokens");
    }
  }
}
