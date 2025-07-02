// import { google } from "googleapis"
// import type { OAuth2Client } from "google-auth-library"
// import fetch from "node-fetch"
// import fs from "fs"
// import path from "path"
// import { promisify } from "util"
// import { pipeline } from "stream"

// const streamPipeline = promisify(pipeline)

// interface YouTubeTokens {
//   accessToken: string
//   refreshToken: string
//   expiresAt: Date
// }

// interface ChannelInfo {
//   id: string
//   title: string
//   description: string
//   thumbnail: string
//   subscriberCount: string
//   videoCount: string
//   viewCount: string
// }

// interface VideoUploadData {
//   title: string
//   description: string
//   tags: string[]
//   cloudinaryVideoUrl: string
//   cloudinaryThumbnailUrl?: string
//   category?: string
//   privacy?: string
// }

// export class YoutubeService {
//   private static oauth2Client: OAuth2Client

//   private static getOAuth2Client(): OAuth2Client {
//     if (!this.oauth2Client) {
//       this.oauth2Client = new google.auth.OAuth2(
//         process.env.YOUTUBE_CLIENT_ID,
//         process.env.YOUTUBE_CLIENT_SECRET,
//         process.env.YOUTUBE_REDIRECT_URI,
//       )
//     }
//     return this.oauth2Client
//   }

//   static async getAuthUrl(): Promise<string> {
//     const oauth2Client = this.getOAuth2Client()

//     const scopes = [
//       "https://www.googleapis.com/auth/youtube.readonly",
//       "https://www.googleapis.com/auth/youtube.upload",
//       "https://www.googleapis.com/auth/youtube",
//     ]

//     const authUrl = oauth2Client.generateAuthUrl({
//       access_type: "offline",
//       scope: scopes,
//       prompt: "consent",
//       include_granted_scopes: true,
//     })

//     return authUrl
//   }

//   static async exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
//     try {
//       const oauth2Client = this.getOAuth2Client()

//       const { tokens } = await oauth2Client.getToken(code)

//       if (!tokens.access_token || !tokens.refresh_token) {
//         throw new Error("Failed to obtain valid tokens from YouTube")
//       }

//       const expiresAt = new Date()
//       if (tokens.expiry_date) {
//         expiresAt.setTime(tokens.expiry_date)
//       } else {
//         expiresAt.setHours(expiresAt.getHours() + 1)
//       }

//       return {
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         expiresAt,
//       }
//     } catch (error) {
//       console.error("Token exchange error:", error)
//       throw new Error("Failed to exchange authorization code for tokens")
//     }
//   }

//   static async refreshTokens(refreshToken: string): Promise<YouTubeTokens> {
//     try {
//       const oauth2Client = this.getOAuth2Client()
//       oauth2Client.setCredentials({ refresh_token: refreshToken })

//       const { credentials } = await oauth2Client.refreshAccessToken()

//       if (!credentials.access_token) {
//         throw new Error("Failed to refresh access token")
//       }

//       const expiresAt = new Date()
//       if (credentials.expiry_date) {
//         expiresAt.setTime(credentials.expiry_date)
//       } else {
//         expiresAt.setHours(expiresAt.getHours() + 1)
//       }

//       return {
//         accessToken: credentials.access_token,
//         refreshToken: credentials.refresh_token || refreshToken,
//         expiresAt,
//       }
//     } catch (error) {
//       console.error("Token refresh error:", error)
//       throw new Error("Failed to refresh YouTube tokens")
//     }
//   }

//   static async getChannelInfo(tokens: YouTubeTokens): Promise<ChannelInfo> {
//     try {
//       const oauth2Client = this.getOAuth2Client()

//       if (new Date() >= tokens.expiresAt) {
//         const refreshedTokens = await this.refreshTokens(tokens.refreshToken)
//         tokens = refreshedTokens
//       }

//       oauth2Client.setCredentials({
//         access_token: tokens.accessToken,
//         refresh_token: tokens.refreshToken,
//       })

//       const youtube = google.youtube({ version: "v3", auth: oauth2Client })

//       const response = await youtube.channels.list({
//         part: ["snippet", "statistics"],
//         mine: true,
//       })

//       if (!response.data.items || response.data.items.length === 0) {
//         throw new Error("No YouTube channel found for this account")
//       }

//       const channel = response.data.items[0]
//       const snippet = channel.snippet!
//       const statistics = channel.statistics!

//       return {
//         id: channel.id!,
//         title: snippet.title || "Unknown Channel",
//         description: snippet.description || "",
//         thumbnail: snippet.thumbnails?.default?.url || "",
//         subscriberCount: statistics.subscriberCount || "0",
//         videoCount: statistics.videoCount || "0",
//         viewCount: statistics.viewCount || "0",
//       }
//     } catch (error) {
//       console.error("Get channel info error:", error)
//       throw new Error("Failed to fetch YouTube channel information")
//     }
//   }

//   static async uploadVideoFromCloudinary(
//     videoData: VideoUploadData,
//     tokens: YouTubeTokens,
//   ): Promise<{ id: string; url: string; title?: string; description?: string }> {
//     try {
//       if (!tokens.accessToken || !tokens.refreshToken) {
//         throw new Error("Invalid YouTube tokens")
//       }

//       const oauth2Client = this.getOAuth2Client()

//       if (new Date() >= tokens.expiresAt) {
//         const refreshedTokens = await this.refreshTokens(tokens.refreshToken)
//         tokens = refreshedTokens
//       }

//       oauth2Client.setCredentials({
//         access_token: tokens.accessToken,
//         refresh_token: tokens.refreshToken,
//       })

//       // Download video from Cloudinary to temporary file
//       const tempDir = path.join(process.cwd(), "temp")
//       if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir, { recursive: true })
//       }

//       const tempVideoPath = path.join(tempDir, `video-${Date.now()}.mp4`)
//       const videoResponse = await fetch(videoData.cloudinaryVideoUrl)

//       if (!videoResponse.ok) {
//         throw new Error("Failed to download video from Cloudinary")
//       }

//       await streamPipeline(videoResponse.body!, fs.createWriteStream(tempVideoPath))

//       try {
//         const youtube = google.youtube({ version: "v3", auth: oauth2Client })

//         const response = await youtube.videos.insert({
//           part: ["snippet", "status"],
//           requestBody: {
//             snippet: {
//               title: videoData.title,
//               description: videoData.description,
//               tags: videoData.tags,
//               categoryId: videoData.category || "22",
//               defaultLanguage: "en",
//             },
//             status: {
//               privacyStatus: videoData.privacy || "private",
//               selfDeclaredMadeForKids: false,
//             },
//           },
//           media: {
//             body: fs.createReadStream(tempVideoPath),
//           },
//         })

//         // Upload thumbnail if provided
//         if (videoData.cloudinaryThumbnailUrl && response.data.id) {
//           try {
//             const tempThumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`)
//             const thumbnailResponse = await fetch(videoData.cloudinaryThumbnailUrl)

//             if (thumbnailResponse.ok) {
//               await streamPipeline(thumbnailResponse.body!, fs.createWriteStream(tempThumbnailPath))

//               await youtube.thumbnails.set({
//                 videoId: response.data.id,
//                 media: {
//                   body: fs.createReadStream(tempThumbnailPath),
//                 },
//               })

//               fs.unlinkSync(tempThumbnailPath)
//             }
//           } catch (thumbnailError) {
//             console.error("Thumbnail upload failed:", thumbnailError)
//           }
//         }

//         return {
//           id: response.data.id!,
//           url: `https://www.youtube.com/watch?v=${response.data.id}`,
//           title: response.data.snippet?.title || undefined,
//           description: response.data.snippet?.description || undefined,
//         }
//       } finally {
//         if (fs.existsSync(tempVideoPath)) {
//           fs.unlinkSync(tempVideoPath)
//         }
//       }
//     } catch (error) {
//       console.error("YouTube upload error:", error)
//       throw new Error("Failed to upload video to YouTube")
//     }
//   }
// }
















import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";
import dotenv from "dotenv";

dotenv.config();
const streamPipeline = promisify(pipeline);

interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface VideoUploadData {
  title: string;
  description: string;
  tags: string[];
  cloudinaryVideoUrl: string;
  cloudinaryThumbnailUrl?: string;
  category?: string;
  privacy?: string;
}

export class YoutubeService {
  private static oauth2Client: OAuth2Client;
  private static initialized = false;

  // Initialize and validate environment
  static initialize() {
    if (this.initialized) return;
    
    const requiredEnvVars = [
      'YOUTUBE_CLIENT_ID',
      'YOUTUBE_CLIENT_SECRET',
      'YOUTUBE_REDIRECT_URI'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(
        `Missing YouTube OAuth environment variables: ${missingVars.join(', ')}`
      );
    }

    console.log("YouTube Service initialized with client ID:", 
      process.env.YOUTUBE_CLIENT_ID?.substring(0, 5) + '...');
    
    this.initialized = true;
  }

  private static getOAuth2Client(): OAuth2Client {
    this.initialize();
    
    if (!this.oauth2Client) {
      // Use non-null assertion since we've validated in initialize()
      this.oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID!.trim(),
        process.env.YOUTUBE_CLIENT_SECRET!.trim(),
        process.env.YOUTUBE_REDIRECT_URI!.trim()
      );
    }
    return this.oauth2Client;
  }

  static async getAuthUrl(): Promise<string> {
    const oauth2Client = this.getOAuth2Client();

    const scopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      include_granted_scopes: true,
    });

    console.log("Generated YouTube auth URL with redirect URI:", 
      process.env.YOUTUBE_REDIRECT_URI);
      
    return authUrl;
  }

  static async exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
    try {
      this.initialize();
      console.log("Exchanging code for tokens. Code length:", code.length);
      
      const oauth2Client = this.getOAuth2Client();
      
      const { tokens } = await oauth2Client.getToken({
        code,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI
      });

      if (!tokens.access_token || !tokens.refresh_token) {
        console.error("Incomplete tokens received:", tokens);
        throw new Error("Failed to obtain valid tokens from YouTube");
      }

      const expiresAt = new Date();
      if (tokens.expiry_date) {
        expiresAt.setTime(tokens.expiry_date);
      } else {
        // Default to 1 hour expiration if not provided
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Token exchange error:", {
          message: error.message,
          stack: error.stack
        });
      }
      
      // Handle Google API errors
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: any } };
        if (apiError.response?.data?.error === "invalid_client") {
          errorMessage = "Invalid YouTube API credentials. Check client ID and secret.";
        } else if (apiError.response?.data?.error === "invalid_grant") {
          errorMessage = "Authorization code is invalid or expired. Please re-authenticate.";
        }
      }
      
      throw new Error(`Failed to exchange authorization code for tokens: ${errorMessage}`);
    }
  }

  static async refreshTokens(refreshToken: string): Promise<YouTubeTokens> {
    try {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("Failed to refresh access token - no access token received");
      }

      const expiresAt = new Date();
      if (credentials.expiry_date) {
        expiresAt.setTime(credentials.expiry_date);
      } else {
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresAt,
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Token refresh error:", error);
      }
      throw new Error(`Failed to refresh YouTube tokens: ${errorMessage}`);
    }
  }

  static async getChannelInfo(tokens: YouTubeTokens): Promise<ChannelInfo> {
    try {
      const oauth2Client = this.getOAuth2Client();

      if (new Date() >= tokens.expiresAt) {
        const refreshedTokens = await this.refreshTokens(tokens.refreshToken);
        tokens = refreshedTokens;
      }

      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const youtube = google.youtube({ version: "v3", auth: oauth2Client });

      const response = await youtube.channels.list({
        part: ["snippet", "statistics"],
        mine: true,
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error("No YouTube channel found for this account");
      }

      const channel = response.data.items[0];
      const snippet = channel.snippet!;
      const statistics = channel.statistics!;

      return {
        id: channel.id!,
        title: snippet.title || "Unknown Channel",
        description: snippet.description || "",
        thumbnail: snippet.thumbnails?.high?.url || "",
        subscriberCount: statistics.subscriberCount || "0",
        videoCount: statistics.videoCount || "0",
        viewCount: statistics.viewCount || "0",
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Get channel info error:", error);
      }
      throw new Error(`Failed to fetch YouTube channel information: ${errorMessage}`);
    }
  }

  static async uploadVideoFromCloudinary(
    videoData: VideoUploadData,
    tokens: YouTubeTokens,
  ): Promise<{ id: string; url: string; title?: string; description?: string }> {
    try {
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error("Invalid YouTube tokens");
      }

      const oauth2Client = this.getOAuth2Client();

      if (new Date() >= tokens.expiresAt) {
        const refreshedTokens = await this.refreshTokens(tokens.refreshToken);
        tokens = refreshedTokens;
      }

      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      // Download video from Cloudinary to temporary file
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempVideoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
      const videoResponse = await fetch(videoData.cloudinaryVideoUrl);

      if (!videoResponse.ok) {
        throw new Error(`Failed to download video from Cloudinary: ${videoResponse.statusText}`);
      }

      await streamPipeline(videoResponse.body!, fs.createWriteStream(tempVideoPath));

      try {
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        // Fix: Pass timeout/retry in options parameter
        const response = await youtube.videos.insert(
          {
            part: ["snippet", "status"],
            requestBody: {
              snippet: {
                title: videoData.title,
                description: videoData.description,
                tags: videoData.tags,
                categoryId: videoData.category || "22", // People & Blogs
                defaultLanguage: "en",
              },
              status: {
                privacyStatus: videoData.privacy || "private",
                selfDeclaredMadeForKids: false,
              },
            },
            media: {
              body: fs.createReadStream(tempVideoPath),
            },
          },
          {
            timeout: 30 * 60 * 1000, // 30 minutes
            retry: true,
          }
        );

        const videoId = response.data.id;
        if (!videoId) {
          throw new Error("YouTube video upload failed: no video ID returned");
        }

        // Upload thumbnail if provided
        if (videoData.cloudinaryThumbnailUrl) {
          try {
            const tempThumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`);
            const thumbnailResponse = await fetch(videoData.cloudinaryThumbnailUrl);

            if (thumbnailResponse.ok) {
              await streamPipeline(thumbnailResponse.body!, fs.createWriteStream(tempThumbnailPath));

              await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                  body: fs.createReadStream(tempThumbnailPath),
                },
              });

              fs.unlinkSync(tempThumbnailPath);
            } else {
              console.warn("Failed to download thumbnail from Cloudinary");
            }
          } catch (thumbnailError) {
            console.error("Thumbnail upload failed:", thumbnailError);
          }
        }

        return {
          id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: response.data.snippet?.title || undefined,
          description: response.data.snippet?.description || undefined,
        };
      } finally {
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("YouTube upload error:", error);
      }
      throw new Error(`Failed to upload video to YouTube: ${errorMessage}`);
    }
  }
}

// Initialize on import
YoutubeService.initialize();