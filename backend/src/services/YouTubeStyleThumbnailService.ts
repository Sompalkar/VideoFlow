import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { CloudinaryService } from "./CloudinaryService";

interface VideoFrame {
  timestamp: number;
  filePath: string;
  url: string;
  quality: number;
  objects: string[];
  colors: string[];
  hasFaces: boolean;
  brightness: number;
  contrast: number;
}

interface ThumbnailStyle {
  name: string;
  description: string;
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  effects: string[];
  position: "top" | "center" | "bottom";
  shadow: boolean;
  glow: boolean;
  border?: boolean;
  borderColor?: string;
}

interface ThumbnailOptions {
  baseImage?: string; // Custom uploaded image URL
  videoUrl?: string; // Video URL for frame extraction
  title: string;
  subtitle?: string;
  style: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  quality: "low" | "medium" | "high";
  variations: number;
  platform: "youtube" | "instagram" | "facebook" | "tiktok";
  customColors?: {
    textColor?: string;
    backgroundColor?: string;
    accentColor?: string;
  };
  effects?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

interface GeneratedThumbnail {
  id: string;
  url: string;
  publicId: string;
  style: string;
  aspectRatio: string;
  quality: string;
  frameInfo?: {
    timestamp: number;
    quality: number;
    objects: string[];
  };
  metadata: {
    title: string;
    subtitle?: string;
    platform: string;
    generatedAt: Date;
  };
}

export class YouTubeStyleThumbnailService {
  private static readonly STYLES: Record<string, ThumbnailStyle> = {
    "cool-energy": {
      name: "Cool Energy",
      description:
        "Cool, yet energetic viral thumbnail. Great for entertainment and viral content.",
      font: "impact",
      fontSize: 80,
      fontColor: "#FF6B35",
      backgroundColor: "#1A1A1A",
      effects: ["shadow", "glow"],
      position: "center",
      shadow: true,
      glow: true,
      border: true,
      borderColor: "#FF6B35",
    },
    "professional-impact": {
      name: "Professional Impact",
      description: "Clean modern professional thumbnail with high impact.",
      font: "arial",
      fontSize: 70,
      fontColor: "#FFFFFF",
      backgroundColor: "#2C3E50",
      effects: ["shadow"],
      position: "bottom",
      shadow: true,
      glow: false,
    },
    "high-energy": {
      name: "High Energy",
      description:
        "Bold, high-energy thumbnail perfect for gaming and exciting content.",
      font: "impact",
      fontSize: 90,
      fontColor: "#FF0000",
      backgroundColor: "#000000",
      effects: ["shadow", "glow", "border"],
      position: "center",
      shadow: true,
      glow: true,
      border: true,
      borderColor: "#FF0000",
    },
    minimalist: {
      name: "Minimalist",
      description:
        "Clean, simple design perfect for educational and tutorial content.",
      font: "helvetica",
      fontSize: 60,
      fontColor: "#333333",
      effects: ["shadow"],
      position: "bottom",
      shadow: true,
      glow: false,
    },
    cinematic: {
      name: "Cinematic",
      description: "Movie-style thumbnail with dramatic effects and lighting.",
      font: "times",
      fontSize: 75,
      fontColor: "#FFD700",
      backgroundColor: "#000000",
      effects: ["shadow", "glow"],
      position: "center",
      shadow: true,
      glow: true,
    },
    "face-reaction": {
      name: "Face Reaction + Zoom",
      description: "Perfect for reaction videos with face zoom effects.",
      font: "impact",
      fontSize: 70,
      fontColor: "#FFFFFF",
      backgroundColor: "#FF6B35",
      effects: ["shadow", "glow"],
      position: "top",
      shadow: true,
      glow: true,
    },
    "bold-overlay": {
      name: "Bold Text Overlay",
      description: "Strong text overlay with maximum impact.",
      font: "impact",
      fontSize: 85,
      fontColor: "#FF0000",
      backgroundColor: "#FFFFFF",
      effects: ["shadow", "border"],
      position: "center",
      shadow: true,
      glow: false,
      border: true,
      borderColor: "#000000",
    },
    "viral-kids": {
      name: "Viral Kids",
      description:
        "Playful, colorful design perfect for family and kids content.",
      font: "comic",
      fontSize: 65,
      fontColor: "#FF6B35",
      backgroundColor: "#FFD700",
      effects: ["shadow", "glow"],
      position: "center",
      shadow: true,
      glow: true,
    },
  };

  /**
   * Generate YouTube-style thumbnails with multiple options
   */
  static async generateThumbnails(
    options: ThumbnailOptions
  ): Promise<GeneratedThumbnail[]> {
    try {
      console.log("YouTube Style Thumbnail Service: Starting generation...");
      console.log("Options:", JSON.stringify(options, null, 2));

      // Step 1: Get base images (frames or uploaded image)
      const baseImages = await this.getBaseImages(options);
      console.log(
        `YouTube Style Thumbnail Service: Got ${baseImages.length} base images`
      );

      // Step 2: Generate thumbnails for each base image
      const thumbnails: GeneratedThumbnail[] = [];
      const style = this.STYLES[options.style] || this.STYLES["cool-energy"];

      for (
        let i = 0;
        i < Math.min(baseImages.length, options.variations);
        i++
      ) {
        const baseImage = baseImages[i];

        try {
          const thumbnail = await this.createThumbnailWithStyle(
            baseImage,
            options,
            style,
            i
          );

          thumbnails.push(thumbnail);
          console.log(
            `YouTube Style Thumbnail Service: Generated thumbnail ${i + 1}/${
              options.variations
            }`
          );
        } catch (error) {
          console.error(
            `YouTube Style Thumbnail Service: Failed to generate thumbnail ${
              i + 1
            }:`,
            error
          );
        }
      }

      // Step 3: Clean up temporary files
      await this.cleanupTempFiles(baseImages);

      console.log(
        `YouTube Style Thumbnail Service: Generated ${thumbnails.length} thumbnails`
      );
      return thumbnails;
    } catch (error) {
      console.error("YouTube Style Thumbnail Service: Error:", error);
      throw new Error("Failed to generate YouTube-style thumbnails");
    }
  }

  /**
   * Get base images from video frames or uploaded image
   */
  private static async getBaseImages(
    options: ThumbnailOptions
  ): Promise<VideoFrame[]> {
    if (options.baseImage) {
      // Use uploaded image
      return [
        {
          timestamp: 0,
          filePath: options.baseImage,
          url: options.baseImage,
          quality: 100,
          objects: ["custom-image"],
          colors: ["#FFFFFF"],
          hasFaces: false,
          brightness: 50,
          contrast: 50,
        },
      ];
    } else if (options.videoUrl) {
      // Extract frames from video
      return await this.extractVideoFrames(options.videoUrl);
    } else {
      throw new Error("Either baseImage or videoUrl must be provided");
    }
  }

  /**
   * Extract frames from video using FFmpeg
   */
  private static async extractVideoFrames(
    videoUrl: string
  ): Promise<VideoFrame[]> {
    try {
      console.log(
        "YouTube Style Thumbnail Service: Extracting video frames..."
      );

      // Get video duration
      const duration = await this.getVideoDuration(videoUrl);
      const frames: VideoFrame[] = [];

      // Create frames directory
      const framesDir = path.join(process.cwd(), "temp-frames");
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }

      // Extract frames at strategic intervals
      const frameCount = 6; // Extract 6 frames for variety
      const interval = Math.max(5, Math.floor(duration / frameCount));

      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * interval;
        const framePath = path.join(framesDir, `frame_${i}_${Date.now()}.jpg`);

        try {
          await this.extractSingleFrame(videoUrl, timestamp, framePath);

          // Analyze frame quality
          const analysis = await this.analyzeFrame(framePath);

          frames.push({
            timestamp,
            filePath: framePath,
            url: framePath,
            quality: analysis.quality,
            objects: analysis.objects,
            colors: analysis.colors,
            hasFaces: analysis.hasFaces,
            brightness: analysis.brightness,
            contrast: analysis.contrast,
          });

          console.log(
            `YouTube Style Thumbnail Service: Extracted frame ${
              i + 1
            }/${frameCount} at ${timestamp}s`
          );
        } catch (error) {
          console.log(
            `YouTube Style Thumbnail Service: Failed to extract frame ${
              i + 1
            }:`,
            error
          );
        }
      }

      // Sort by quality and return top frames
      return frames.sort((a, b) => b.quality - a.quality).slice(0, 4);
    } catch (error) {
      console.error(
        "YouTube Style Thumbnail Service: Frame extraction failed:",
        error
      );
      throw new Error("Failed to extract video frames");
    }
  }

  /**
   * Get video duration using FFmpeg
   */
  private static async getVideoDuration(videoUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "quiet",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        videoUrl,
      ]);

      let output = "";

      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          resolve(duration || 60);
        } else {
          resolve(60);
        }
      });

      ffprobe.on("error", () => {
        resolve(60);
      });
    });
  }

  /**
   * Extract a single frame from video
   */
  private static async extractSingleFrame(
    videoUrl: string,
    timestamp: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoUrl,
        "-ss",
        timestamp.toString(),
        "-vframes",
        "1",
        "-q:v",
        "2",
        "-vf",
        "scale=1280:720",
        "-y",
        outputPath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });

      setTimeout(() => {
        ffmpeg.kill();
        reject(new Error("FFmpeg timeout"));
      }, 30000);
    });
  }

  /**
   * Analyze frame for quality and content
   */
  private static async analyzeFrame(framePath: string): Promise<{
    quality: number;
    objects: string[];
    colors: string[];
    hasFaces: boolean;
    brightness: number;
    contrast: number;
  }> {
    try {
      // In production, use computer vision APIs here
      // For now, simulate analysis

      const quality = Math.floor(Math.random() * 40) + 60; // 60-100
      const objects = ["person", "vehicle", "outdoor", "nature"];
      const colors = ["#87CEEB", "#98FB98", "#F0E68C", "#FFB6C1"];
      const hasFaces = Math.random() > 0.5;
      const brightness = Math.floor(Math.random() * 100);
      const contrast = Math.floor(Math.random() * 100);

      return { quality, objects, colors, hasFaces, brightness, contrast };
    } catch (error) {
      console.error(
        "YouTube Style Thumbnail Service: Frame analysis failed:",
        error
      );
      return {
        quality: 70,
        objects: ["content"],
        colors: ["#3B82F6"],
        hasFaces: false,
        brightness: 50,
        contrast: 50,
      };
    }
  }

  /**
   * Create thumbnail with specific style
   */
  private static async createThumbnailWithStyle(
    frame: VideoFrame,
    options: ThumbnailOptions,
    style: ThumbnailStyle,
    index: number
  ): Promise<GeneratedThumbnail> {
    try {
      // Upload frame to Cloudinary
      const uploadResult = await CloudinaryService.uploadImage(frame.filePath, {
        folder: "youtube-thumbnails",
        publicId: `yt-thumb-${Date.now()}-${index}`,
      });

      // Create transformation with style
      const transformation = this.createStyleTransformation(options, style);

      // Generate final thumbnail URL
      const thumbnailUrl = CloudinaryService.getOptimizedUrl(
        uploadResult.public_id,
        {
          transformation: [transformation],
          width: this.getWidthForAspectRatio(options.aspectRatio),
          height: this.getHeightForAspectRatio(options.aspectRatio),
          quality: this.getQualitySetting(options.quality),
          format: "jpg",
        }
      );

      return {
        id: `thumb-${Date.now()}-${index}`,
        url: thumbnailUrl,
        publicId: uploadResult.public_id,
        style: style.name,
        aspectRatio: options.aspectRatio,
        quality: options.quality,
        frameInfo: {
          timestamp: frame.timestamp,
          quality: frame.quality,
          objects: frame.objects,
        },
        metadata: {
          title: options.title,
          subtitle: options.subtitle,
          platform: options.platform,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error(
        "YouTube Style Thumbnail Service: Failed to create thumbnail:",
        error
      );
      throw error;
    }
  }

  /**
   * Create Cloudinary transformation based on style
   */
  private static createStyleTransformation(
    options: ThumbnailOptions,
    style: ThumbnailStyle
  ): any {
    const baseTransformation = {
      width: this.getWidthForAspectRatio(options.aspectRatio),
      height: this.getHeightForAspectRatio(options.aspectRatio),
      crop: "fill",
      gravity: "center",
    };

    // Add effects
    const effects: any[] = [];

    if (options.effects?.brightness) {
      effects.push({ brightness: options.effects.brightness });
    }
    if (options.effects?.contrast) {
      effects.push({ contrast: options.effects.contrast });
    }
    if (options.effects?.saturation) {
      effects.push({ saturation: options.effects.saturation });
    }

    // Create text overlay
    const textOverlay = {
      overlay: `text:${style.font}_${style.fontSize}_bold:${encodeURIComponent(
        options.title
      )}`,
      color: options.customColors?.textColor || style.fontColor,
      gravity: style.position,
      y: this.getYPosition(style.position),
      effect: this.getTextEffects(style),
    };

    return {
      ...baseTransformation,
      ...effects,
      overlay: [textOverlay],
    };
  }

  /**
   * Get width for aspect ratio
   */
  private static getWidthForAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case "16:9":
        return 1280;
      case "9:16":
        return 720;
      case "1:1":
        return 1080;
      default:
        return 1280;
    }
  }

  /**
   * Get height for aspect ratio
   */
  private static getHeightForAspectRatio(aspectRatio: string): number {
    switch (aspectRatio) {
      case "16:9":
        return 720;
      case "9:16":
        return 1280;
      case "1:1":
        return 1080;
      default:
        return 720;
    }
  }

  /**
   * Get quality setting
   */
  private static getQualitySetting(quality: string): string {
    switch (quality) {
      case "low":
        return "60";
      case "medium":
        return "80";
      case "high":
        return "95";
      default:
        return "80";
    }
  }

  /**
   * Get Y position for text
   */
  private static getYPosition(position: string): number {
    switch (position) {
      case "top":
        return 50;
      case "center":
        return 0;
      case "bottom":
        return -50;
      default:
        return 0;
    }
  }

  /**
   * Get text effects
   */
  private static getTextEffects(style: ThumbnailStyle): string {
    const effects: string[] = [];

    if (style.shadow) {
      effects.push("shadow:10");
    }
    if (style.glow) {
      effects.push("glow:20");
    }
    if (style.border) {
      effects.push(`border:3px_solid_${style.borderColor || "#000000"}`);
    }

    return effects.join(",");
  }

  /**
   * Get available styles
   */
  static getAvailableStyles(): ThumbnailStyle[] {
    return Object.values(this.STYLES);
  }

  /**
   * Get style by name
   */
  static getStyle(name: string): ThumbnailStyle | null {
    return this.STYLES[name] || null;
  }

  /**
   * Clean up temporary files
   */
  private static async cleanupTempFiles(frames: VideoFrame[]): Promise<void> {
    try {
      for (const frame of frames) {
        if (fs.existsSync(frame.filePath)) {
          fs.unlinkSync(frame.filePath);
        }
      }

      const framesDir = path.join(process.cwd(), "temp-frames");
      if (fs.existsSync(framesDir)) {
        const files = fs.readdirSync(framesDir);
        for (const file of files) {
          if (file.endsWith(".jpg")) {
            fs.unlinkSync(path.join(framesDir, file));
          }
        }
      }

      console.log(
        "YouTube Style Thumbnail Service: Cleaned up temporary files"
      );
    } catch (error) {
      console.error(
        "YouTube Style Thumbnail Service: Failed to cleanup files:",
        error
      );
    }
  }
}
