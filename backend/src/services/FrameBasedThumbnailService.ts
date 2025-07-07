import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { CloudinaryService } from "./CloudinaryService";

interface VideoFrame {
  timestamp: number;
  filePath: string;
  url: string;
  objects: string[];
  colors: string[];
  text: string[];
  scene: string;
  quality: number; // 0-100, based on visual appeal
}

interface ThumbnailOptions {
  title: string;
  subtitle?: string;
  style: "modern" | "bold" | "minimal" | "dramatic";
  textColor: string;
  backgroundColor: string;
  overlayOpacity: number;
  addGlow?: boolean;
  addShadow?: boolean;
}

export class FrameBasedThumbnailService {
  private static readonly FRAME_INTERVAL = 10; // Extract frame every 10 seconds
  private static readonly MAX_FRAMES = 8; // Maximum frames to analyze

  /**
   * Generate thumbnails based on actual video frames
   */
  static async generateFrameBasedThumbnails(
    videoUrl: string,
    title: string,
    description: string
  ): Promise<Array<{ url: string; publicId: string; frame: VideoFrame; style: string }>> {
    try {
      console.log("Frame-Based Thumbnail Service: Starting frame-based generation...");

      // Step 1: Extract frames from video
      const frames = await this.extractVideoFrames(videoUrl);
      console.log(`Frame-Based Thumbnail Service: Extracted ${frames.length} frames`);

      // Step 2: Analyze frames for quality and content
      const analyzedFrames = await this.analyzeFrames(frames);
      console.log("Frame-Based Thumbnail Service: Frame analysis completed");

      // Step 3: Select the best frames
      const bestFrames = this.selectBestFrames(analyzedFrames, 3);
      console.log(`Frame-Based Thumbnail Service: Selected ${bestFrames.length} best frames`);

      // Step 4: Generate thumbnails with text overlays
      const thumbnails = await this.generateThumbnailsWithText(bestFrames, title, description);
      console.log("Frame-Based Thumbnail Service: Thumbnail generation completed");

      return thumbnails;
    } catch (error) {
      console.error("Frame-Based Thumbnail Service: Error:", error);
      throw new Error("Failed to generate frame-based thumbnails");
    }
  }

  /**
   * Extract frames from video using FFmpeg
   */
  private static async extractVideoFrames(videoUrl: string): Promise<VideoFrame[]> {
    try {
      console.log("Frame-Based Thumbnail Service: Extracting frames...");

      // Get video duration first
      const duration = await this.getVideoDuration(videoUrl);
      const frames: VideoFrame[] = [];

      // Create frames directory
      const framesDir = path.join(process.cwd(), "frames");
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }

      // Extract frames at intervals
      const frameCount = Math.min(Math.floor(duration / this.FRAME_INTERVAL), this.MAX_FRAMES);
      
      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * this.FRAME_INTERVAL;
        const framePath = path.join(framesDir, `frame_${i}_${Date.now()}.jpg`);

        try {
          await this.extractSingleFrame(videoUrl, timestamp, framePath);
          
          frames.push({
            timestamp,
            filePath: framePath,
            url: framePath,
            objects: [],
            colors: [],
            text: [],
            scene: "general",
            quality: 0
          });

          console.log(`Frame-Based Thumbnail Service: Extracted frame ${i + 1}/${frameCount} at ${timestamp}s`);
        } catch (error) {
          console.log(`Frame-Based Thumbnail Service: Failed to extract frame ${i + 1}:`, error);
        }
      }

      return frames;
    } catch (error) {
      console.error("Frame-Based Thumbnail Service: Frame extraction failed:", error);
      throw new Error("Failed to extract video frames");
    }
  }

  /**
   * Get video duration using FFmpeg
   */
  private static async getVideoDuration(videoUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "csv=p=0",
        videoUrl
      ]);

      let output = "";
      
      ffprobe.stdout.on("data", (data) => {
        output += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          resolve(duration || 60); // Default to 60 seconds
        } else {
          resolve(60); // Default duration
        }
      });

      ffprobe.on("error", () => {
        resolve(60); // Default duration
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
        "-i", videoUrl,
        "-ss", timestamp.toString(),
        "-vframes", "1",
        "-q:v", "2", // High quality
        "-vf", "scale=1280:720", // Resize to 720p
        "-y",
        outputPath
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

      // Timeout after 30 seconds
      setTimeout(() => {
        ffmpeg.kill();
        reject(new Error("FFmpeg timeout"));
      }, 30000);
    });
  }

  /**
   * Analyze frames for content and quality
   */
  private static async analyzeFrames(frames: VideoFrame[]): Promise<VideoFrame[]> {
    const analyzedFrames: VideoFrame[] = [];

    for (const frame of frames) {
      try {
        // Analyze frame content (simplified for now)
        const analysis = await this.analyzeFrameContent(frame.filePath);
        
        analyzedFrames.push({
          ...frame,
          objects: analysis.objects,
          colors: analysis.colors,
          text: analysis.text,
          scene: analysis.scene,
          quality: analysis.quality
        });
      } catch (error) {
        console.log(`Frame-Based Thumbnail Service: Failed to analyze frame:`, error);
        // Keep frame with default values
        analyzedFrames.push(frame);
      }
    }

    return analyzedFrames;
  }

  /**
   * Analyze content of a single frame
   */
  private static async analyzeFrameContent(framePath: string): Promise<{
    objects: string[];
    colors: string[];
    text: string[];
    scene: string;
    quality: number;
  }> {
    try {
      // In a production system, you'd use computer vision APIs here
      // For now, we'll do basic analysis based on the frame path
      
      // Simulate object detection
      const objects = ["person", "vehicle", "outdoor", "nature"];
      
      // Simulate color analysis
      const colors = ["#87CEEB", "#98FB98", "#F0E68C", "#FFB6C1"];
      
      // Simulate text detection
      const text: string[] = [];
      
      // Simulate scene detection
      const scene = "outdoor";
      
      // Simulate quality score (0-100)
      const quality = Math.floor(Math.random() * 40) + 60; // 60-100

      return { objects, colors, text, scene, quality };
    } catch (error) {
      console.error("Frame-Based Thumbnail Service: Frame analysis failed:", error);
      return {
        objects: ["content"],
        colors: ["#3B82F6"],
        text: [],
        scene: "general",
        quality: 50
      };
    }
  }

  /**
   * Select the best frames based on quality and content
   */
  private static selectBestFrames(frames: VideoFrame[], count: number): VideoFrame[] {
    // Sort frames by quality score
    const sortedFrames = frames.sort((a, b) => b.quality - a.quality);
    
    // Return top frames
    return sortedFrames.slice(0, count);
  }

  /**
   * Generate thumbnails with text overlays
   */
  private static async generateThumbnailsWithText(
    frames: VideoFrame[],
    title: string,
    description: string
  ): Promise<Array<{ url: string; publicId: string; frame: VideoFrame; style: string }>> {
    const thumbnails = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const style = this.getStyleForIndex(i);
      
      try {
        // Create thumbnail with text overlay
        const thumbnailResult = await this.createThumbnailWithText(frame, title, style);
        
        thumbnails.push({
          url: thumbnailResult.url,
          publicId: thumbnailResult.publicId,
          frame,
          style
        });

        console.log(`Frame-Based Thumbnail Service: Generated thumbnail ${i + 1}/${frames.length} with style: ${style}`);
      } catch (error) {
        console.error(`Frame-Based Thumbnail Service: Failed to generate thumbnail ${i + 1}:`, error);
      }
    }

    return thumbnails;
  }

  /**
   * Create a thumbnail with text overlay using Cloudinary
   */
  private static async createThumbnailWithText(
    frame: VideoFrame,
    title: string,
    style: string
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Upload the frame to Cloudinary
      const uploadResult = await CloudinaryService.uploadImage(frame.filePath, {
        folder: "thumbnails",
        publicId: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Create text overlay transformation
      const transformation = this.getTextTransformation(title, style);
      
      // Generate the final thumbnail URL with text overlay
      const thumbnailUrl = CloudinaryService.getOptimizedUrl(uploadResult.public_id, {
        transformation: [transformation],
        width: 1280,
        height: 720,
        quality: "auto",
        format: "jpg"
      });

      return {
        url: thumbnailUrl,
        publicId: uploadResult.public_id
      };
    } catch (error) {
      console.error("Frame-Based Thumbnail Service: Failed to create thumbnail with text:", error);
      throw error;
    }
  }

  /**
   * Get text transformation based on style
   */
  private static getTextTransformation(title: string, style: string): any {
    const baseTransformation = {
      width: 1280,
      height: 720,
      crop: "fill",
      gravity: "center"
    };

    switch (style) {
      case "modern":
        return {
          ...baseTransformation,
          overlay: [
            {
              overlay: "text:arial_60_bold:" + encodeURIComponent(title),
              color: "#FFFFFF",
              gravity: "south",
              y: 50,
              effect: "shadow:10"
            }
          ]
        };

      case "bold":
        return {
          ...baseTransformation,
          overlay: [
            {
              overlay: "text:impact_70_bold:" + encodeURIComponent(title),
              color: "#FF0000",
              gravity: "center",
              effect: "shadow:15"
            }
          ]
        };

      case "minimal":
        return {
          ...baseTransformation,
          overlay: [
            {
              overlay: "text:helvetica_50:" + encodeURIComponent(title),
              color: "#000000",
              gravity: "south",
              y: 30,
              effect: "shadow:5"
            }
          ]
        };

      case "dramatic":
        return {
          ...baseTransformation,
          overlay: [
            {
              overlay: "text:arial_black_80_bold:" + encodeURIComponent(title),
              color: "#FFD700",
              gravity: "center",
              effect: "shadow:20"
            }
          ]
        };

      default:
        return {
          ...baseTransformation,
          overlay: [
            {
              overlay: "text:arial_60:" + encodeURIComponent(title),
              color: "#FFFFFF",
              gravity: "south",
              y: 40
            }
          ]
        };
    }
  }

  /**
   * Get style based on frame index
   */
  private static getStyleForIndex(index: number): string {
    const styles = ["modern", "bold", "minimal", "dramatic"];
    return styles[index % styles.length];
  }

  /**
   * Clean up extracted frames
   */
  static async cleanupFrames(): Promise<void> {
    try {
      const framesDir = path.join(process.cwd(), "frames");
      if (fs.existsSync(framesDir)) {
        const files = fs.readdirSync(framesDir);
        for (const file of files) {
          if (file.endsWith('.jpg')) {
            fs.unlinkSync(path.join(framesDir, file));
          }
        }
        console.log("Frame-Based Thumbnail Service: Cleaned up extracted frames");
      }
    } catch (error) {
      console.error("Frame-Based Thumbnail Service: Failed to cleanup frames:", error);
    }
  }
} 