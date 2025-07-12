import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { AIThumbnailService } from "../services/AIThumbnailService";
import Video from "../models/Video";

export class AIThumbnailController {
  static async generateThumbnails(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        videoUrl,
        title,
        description,
        style,
        colors,
        text,
        aspectRatio,
        videoId,
      } = req.body;
      const { userId } = req.user!;

      console.log(
        "AI Thumbnail Controller: Generating thumbnails for user:",
        userId
      );
      console.log("AI Thumbnail Controller: Video title:", title);

      const options = {
        style: style || "modern",
        colors: colors || ["#3B82F6", "#EF4444", "#10B981"],
        text: text || title,
        overlay: true,
        aspectRatio: aspectRatio || "16:9",
      };

      const thumbnails = await AIThumbnailService.generateThumbnails(
        videoUrl,
        title,
        description,
        options
      );

      // If videoId is provided, associate the first generated thumbnail with the video
      if (videoId && thumbnails.length > 0) {
        const video = await Video.findById(videoId);
        if (video) {
          video.cloudinaryThumbnailUrl = thumbnails[0].url;
          video.cloudinaryThumbnailId = thumbnails[0].publicId;
          video.thumbnail = thumbnails[0].url;
          await video.save();
        }
      }

      console.log(
        "AI Thumbnail Controller: Generated",
        thumbnails.length,
        "thumbnails"
      );

      res.json({
        success: true,
        thumbnails,
        message: `Generated ${thumbnails.length} thumbnail variations`,
      });
    } catch (error) {
      console.error(
        "AI Thumbnail Controller: Error generating thumbnails:",
        error
      );
      res.status(500).json({
        message: "Failed to generate thumbnails",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async enhanceThumbnail(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { thumbnailUrl, brightness, contrast, saturation, text, overlay } =
        req.body;
      const { userId } = req.user!;

      console.log(
        "AI Thumbnail Controller: Enhancing thumbnail for user:",
        userId
      );

      const enhancements = {
        brightness: brightness || 0,
        contrast: contrast || 0,
        saturation: saturation || 0,
        text: text || "",
        overlay: overlay || false,
      };

      const enhancedThumbnail = await AIThumbnailService.enhanceThumbnail(
        thumbnailUrl,
        enhancements
      );

      res.json({
        success: true,
        thumbnail: enhancedThumbnail,
        message: "Thumbnail enhanced successfully",
      });
    } catch (error) {
      console.error(
        "AI Thumbnail Controller: Error enhancing thumbnail:",
        error
      );
      res.status(500).json({
        message: "Failed to enhance thumbnail",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async analyzeVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { videoUrl } = req.body;
      const { userId } = req.user!;

      console.log("AI Thumbnail Controller: Analyzing video for user:", userId);

      const analysis = await AIThumbnailService.analyzeVideoContent(videoUrl);

      res.json({
        success: true,
        analysis,
        message: "Video analysis completed",
      });
    } catch (error) {
      console.error("AI Thumbnail Controller: Error analyzing video:", error);
      res.status(500).json({
        message: "Failed to analyze video",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getThumbnailStyles(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const styles = [
        {
          id: "modern",
          name: "Modern",
          description: "Clean, contemporary design with gradients",
          preview: "/api/thumbnails/preview/modern",
        },
        {
          id: "bold",
          name: "Bold",
          description: "High contrast, dramatic, attention-grabbing",
          preview: "/api/thumbnails/preview/bold",
        },
        {
          id: "minimal",
          name: "Minimal",
          description: "Simple, clean, professional appearance",
          preview: "/api/thumbnails/preview/minimal",
        },
        {
          id: "vintage",
          name: "Vintage",
          description: "Retro style with warm colors",
          preview: "/api/thumbnails/preview/vintage",
        },
        {
          id: "professional",
          name: "Professional",
          description: "Corporate, business-focused design",
          preview: "/api/thumbnails/preview/professional",
        },
      ];

      res.json({
        success: true,
        styles,
        message: "Thumbnail styles retrieved successfully",
      });
    } catch (error) {
      console.error("AI Thumbnail Controller: Error getting styles:", error);
      res.status(500).json({
        message: "Failed to get thumbnail styles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async enhanceFrameImg2Img(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        frameUrl,
        prompt,
        style,
        aspectRatio,
        // apiKey, // REMOVE user-provided apiKey
        strength,
        guidanceScale,
        service,
        videoTitle,
        videoDescription,
      } = req.body;

      if (!frameUrl || !prompt) {
        res.status(400).json({
          success: false,
          message: "frameUrl and prompt are required",
        });
        return;
      }

      console.log("AI Thumbnail Controller: Starting img2img enhancement");
      console.log("AI Thumbnail Controller: Frame URL:", frameUrl);
      console.log("AI Thumbnail Controller: Prompt:", prompt);
      console.log("AI Thumbnail Controller: Service:", service);
      console.log("AI Thumbnail Controller: Video Title:", videoTitle);
      console.log(
        "AI Thumbnail Controller: Video Description:",
        videoDescription
      );

      // Only use API key from environment variables
      let finalApiKey: string | undefined = undefined;
      console.log(
        "AI Thumbnail Controller: Using API key from environment variables..."
      );

      // Services that don't require API keys (use basic transformations)
      const noApiKeyServices = ["precise", "basic", "preservation", "mock"];

      if (noApiKeyServices.includes(service)) {
        console.log(
          "AI Thumbnail Controller: Service doesn't require API key:",
          service
        );
        finalApiKey = undefined;
      } else if (service === "stability" || service === "stability-ai") {
        finalApiKey = process.env.STABILITY_API_KEY;
      } else if (service === "openai" || service === "dalle") {
        finalApiKey = process.env.OPENAI_API_KEY;
      } else if (service === "leonardo") {
        finalApiKey = process.env.LEONARDO_API_KEY;
      } else if (service === "huggingface") {
        finalApiKey = process.env.HUGGINGFACE_API_KEY;
      } else {
        // Default to Stability AI for unknown services
        finalApiKey = process.env.STABILITY_API_KEY;
      }

      console.log(
        "AI Thumbnail Controller: Using API key:",
        finalApiKey ? "Available" : "Not required for this service"
      );
      console.log("AI Thumbnail Controller: Service:", service);

      const result = await AIThumbnailService.enhanceFrameWithImg2Img(
        frameUrl,
        prompt,
        {
          style: style || "enhanced",
          aspectRatio: aspectRatio || "16:9",
          apiKey: finalApiKey,
          strength: strength || 0.15,
          guidanceScale: guidanceScale || 6,
          service: service || "stability",
          videoTitle,
          videoDescription,
        }
      );

      console.log("AI Thumbnail Controller: Enhancement successful");
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("AI Thumbnail Controller: Enhancement error:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to enhance frame",
      });
    }
  }

  static async applyOverlay(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        publicId,
        text,
        fontFamily,
        fontSize,
        fontColor,
        position,
        background,
        opacity,
        width,
        height,
      } = req.body;
      if (!publicId || !text) {
        res.status(400).json({
          message: "publicId and text are required",
        });
        return;
      }
      const url = await AIThumbnailService.applyOverlay(publicId, {
        text,
        fontFamily,
        fontSize,
        fontColor,
        position,
        background,
        opacity,
        width,
        height,
      });
      res.json({
        success: true,
        url,
        message: "Overlay applied successfully",
      });
    } catch (error) {
      console.error("AIThumbnailController: overlay error", error);
      res.status(500).json({
        message: "Failed to apply overlay",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async fallbackTextToImage(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { prompt, aspectRatio, style, apiKey } = req.body;
      if (!prompt) {
        res.status(400).json({
          message: "prompt is required",
        });
        return;
      }
      const result = await AIThumbnailService.generateWithAI(prompt, {
        aspectRatio,
        style,
        apiKey,
      });
      res.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        message: "Generated image from text prompt successfully",
      });
    } catch (error) {
      console.error("AIThumbnailController: text2img fallback error", error);
      res.status(500).json({
        message: "Failed to generate image from text prompt",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
