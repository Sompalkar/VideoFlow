import { CloudinaryService } from "./CloudinaryService";
import { VideoAnalysisService } from "./VideoAnalysisService";
import fetch from "node-fetch";

interface ThumbnailGenerationOptions {
  style?: "modern" | "vintage" | "minimal" | "bold" | "professional" | string;
  colors?: string[];
  text?: string;
  overlay?: boolean;
  aspectRatio?: "16:9" | "1:1" | "4:3" | string;
}

interface GeneratedThumbnail {
  id: string;
  url: string;
  publicId: string;
  style: string;
  prompt: string;
}

export class AIThumbnailService {
  private static get HF_API_KEY() {
    return process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;
  }
  
  private static readonly HF_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

  static async generateThumbnails(
    videoUrl: string,
    title: string,
    description: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<GeneratedThumbnail[]> {
    try {
      console.log("AI Thumbnail Service: Performing video analysis...");
      const videoAnalysis = await VideoAnalysisService.analyzeVideo(videoUrl, title, description);
      
      const {
        style = videoAnalysis.suggestedThumbnailElements?.style || "modern",
        aspectRatio = "16:9",
        colors = videoAnalysis.suggestedThumbnailElements?.colors || ["#3B82F6"],
      } = options;

      const thumbnails: GeneratedThumbnail[] = [];
      const styles = ["modern", "bold", "minimal", "professional"];
      
      // Generate multiple variations
      for (const currentStyle of styles) {
        const prompt = this.generateSmartPrompt(title, videoAnalysis, currentStyle, colors);
        const thumbnail = await this.generateWithAI(prompt, { aspectRatio, style: currentStyle });
        thumbnails.push(thumbnail);
      }

      return thumbnails;
    } catch (error) {
      console.error("AI Thumbnail Service: Error generating thumbnails:", error);
      throw new Error("Failed to generate AI thumbnails");
    }
  }

  private static generateSmartPrompt(title: string, analysis: any, style: string, colors: string[]): string {
    const category = analysis.category || "general";
    const contentType = analysis.contentType || "video";
    const objects = (analysis.dominantObjects || []).slice(0, 3).join(", ") || "abstract background";
    const tone = analysis.emotionalTone || "professional";
    
    return `High quality YouTube thumbnail for "${title}" - ${contentType} content. 
    Category: ${category} with ${tone} tone. 
    Features prominent ${objects}. 
    Style: ${style}. Clean, highly detailed, vibrant lighting, professional design optimized for YouTube engagement.`;
  }

  public static async generateWithAI(
    prompt: string,
    options: { aspectRatio: string; style: string; apiKey?: string }
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || this.HF_API_KEY;
      if (!apiKey) {
        throw new Error("No Hugging Face API key provided");
      }

      console.log(`AI Thumbnail Service: Requesting image from Hugging Face FLUX.1-schnell`);

      const response = await fetch(this.HF_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt.substring(0, 1000), // Limit length
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      const dataUri = `data:image/jpeg;base64,${base64Data}`;

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadImageFromDataUrl(
        dataUri,
        {
          folder: "thumbnails",
          publicId: `ai-${options.style}-${Date.now()}`,
        }
      );

      return {
        id: `hf-${Date.now()}`,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        style: options.style,
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: AI generation failed:", error);
      throw error;
    }
  }

  static async enhanceThumbnail(
    thumbnailUrl: string,
    enhancements: { brightness?: number; contrast?: number; saturation?: number; }
  ): Promise<{ url: string; publicId: string }> {
    try {
      const transformation = {
        brightness: enhancements.brightness || 0,
        contrast: enhancements.contrast || 0,
        saturation: enhancements.saturation || 0,
      };
      const enhancedUrl = await CloudinaryService.transformImage(thumbnailUrl, transformation);
      return { url: enhancedUrl, publicId: thumbnailUrl };
    } catch (error) {
      throw new Error("Failed to enhance thumbnail");
    }
  }

  static async analyzeVideoContent(videoUrl: string): Promise<{
    dominantColors: string[];
    suggestedStyles: string[];
    recommendedText: string[];
  }> {
    return {
      dominantColors: ["#3B82F6", "#EF4444", "#10B981"],
      suggestedStyles: ["modern", "bold", "professional"],
      recommendedText: ["Watch Now", "Learn More", "Discover"],
    };
  }

  static async enhanceFrameWithImg2Img(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      strength?: number;
      guidanceScale?: number;
      service?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    console.log("AI Thumbnail Service: Generating AI image from prompt (HuggingFace)...");
    
    // Clean and structure the prompt for FLUX.1 diffusion model
    // Diffusion models work best with visual descriptions, not conversational instructions
    let enhancedPrompt = `A high-quality, vibrant, cinematic YouTube thumbnail featuring: ${prompt}. Professional photography, highly detailed, eye-catching, vibrant colors, 8k resolution, photorealistic.`;
    
    if (options.videoTitle) {
      enhancedPrompt += ` Context: related to "${options.videoTitle}".`;
    }
    
    // Generate new image
    const aiThumbnail = await this.generateWithAI(enhancedPrompt, {
      aspectRatio: options.aspectRatio || "16:9",
      style: options.style || "enhanced",
      apiKey: options.apiKey
    });

    return aiThumbnail;
  }

  static async applyOverlay(
    publicId: string,
    options: {
      text: string;
      fontFamily?: string;
      fontSize?: number;
      fontColor?: string;
      position?: { gravity?: string; x?: number; y?: number };
      background?: string;
      opacity?: number;
      width?: number;
      height?: number;
    }
  ): Promise<string> {
     return CloudinaryService.getOverlayedImageUrl(publicId, options);
  }
}
