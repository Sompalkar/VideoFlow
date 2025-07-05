import { CloudinaryService } from "./CloudinaryService";

interface ThumbnailGenerationOptions {
  style?: "modern" | "vintage" | "minimal" | "bold" | "professional";
  colors?: string[];
  text?: string;
  overlay?: boolean;
  aspectRatio?: "16:9" | "1:1" | "4:3";
}

interface GeneratedThumbnail {
  id: string;
  url: string;
  publicId: string;
  style: string;
  prompt: string;
}

interface OpenAIError {
  error?: {
    message?: string;
  };
}

interface OpenAIResponse {
  data: Array<{
    url: string;
  }>;
}

interface StabilityAIResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export class AIThumbnailService {
  private static readonly OPENAI_API_KEY =
    "sk-ww99-wdXQ4esojHqVo4fBnC_nmt5Wg_5YIOAtD7K-aT3BlbkFJMiiUqRpTXyGYR0gSsLVmywV8l4zBrcLnhBrTcTYagA";

  private static readonly OPENAI_API_URL =
    "https://api.openai.com/v1/images/generations";

  // Alternative API (Stability AI) - you can add your key here
  private static readonly STABILITY_API_KEY =  "sk-c3Oqfy6LlL2eI2gALeidQB0X58MnmcBdKgrjWu5V6ped2OeQ";
  private static readonly STABILITY_API_URL =
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

  static async generateThumbnails(
    videoUrl: string,
    title: string,
    description: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<GeneratedThumbnail[]> {
    try {
      console.log("AI Thumbnail Service: Generating thumbnails for:", title);
      console.log("AI Thumbnail Service: Video URL type:", typeof videoUrl);
      console.log(
        "AI Thumbnail Service: Video URL starts with:",
        videoUrl.substring(0, 20)
      );

      if (!this.STABILITY_API_KEY) {
        console.error(
          "AI Thumbnail Service: Stability AI API key not configured"
        );
        throw new Error("Stability AI API key not configured");
      }

      const {
        style = "modern",
        colors = ["#3B82F6", "#EF4444", "#10B981"],
        text = title,
        overlay = true,
        aspectRatio = "16:9",
      } = options;

      // Generate multiple thumbnail variations
      const thumbnails: GeneratedThumbnail[] = [];

      // Style 1: Modern with gradient
      const modernPrompt = `A modern YouTube thumbnail for "${title}". Professional design with blue, red, and green color scheme. High contrast, eye-catching layout with clean typography.`;

      const modernThumbnail = await this.generateWithAI(modernPrompt, {
        aspectRatio,
        style: "modern",
      });
      thumbnails.push(modernThumbnail);

      // Style 2: Bold and dramatic
      const boldPrompt = `A bold dramatic YouTube thumbnail for "${title}". High contrast design with vibrant colors and dramatic lighting. Attention-grabbing visual style.`;

      const boldThumbnail = await this.generateWithAI(boldPrompt, {
        aspectRatio,
        style: "bold",
      });
      thumbnails.push(boldThumbnail);

      // Style 3: Minimal and clean
      const minimalPrompt = `A minimal clean YouTube thumbnail for "${title}". Simple design with clean typography and subtle colors. Professional and elegant appearance.`;

      const minimalThumbnail = await this.generateWithAI(minimalPrompt, {
        aspectRatio,
        style: "minimal",
      });
      thumbnails.push(minimalThumbnail);

      console.log(
        `AI Thumbnail Service: Generated ${thumbnails.length} thumbnails`
      );
      return thumbnails;
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Error generating thumbnails:",
        error
      );
      throw new Error("Failed to generate AI thumbnails");
    }
  }

  private static async generateWithAI(
    prompt: string,
    options: { aspectRatio: string; style: string }
  ): Promise<GeneratedThumbnail> {
    try {
      console.log("AI Thumbnail Service: Generating with prompt:", prompt);

      // Use Stability AI as primary service
      try {
        return await this.generateWithStabilityAI(prompt, options);
      } catch (stabilityError) {
        console.log(
          "AI Thumbnail Service: Stability AI failed, trying OpenAI..."
        );

        // Try OpenAI as fallback
        if (this.OPENAI_API_KEY) {
          try {
            return await this.generateWithOpenAI(prompt, options);
          } catch (openAIError) {
            console.error("AI Thumbnail Service: Both APIs failed:", {
              stabilityError,
              openAIError,
            });
            throw stabilityError; // Throw the original error
          }
        } else {
          throw stabilityError;
        }
      }
    } catch (error) {
      console.error("AI Thumbnail Service: Error in AI generation:", error);
      throw new Error("Failed to generate thumbnail with AI");
    }
  }

  private static async generateWithOpenAI(
    prompt: string,
    options: { aspectRatio: string; style: string }
  ): Promise<GeneratedThumbnail> {
    // Get dimensions based on aspect ratio
    const dimensions = this.getDimensionsFromAspectRatio(options.aspectRatio);

    // Clean and improve the prompt for DALL-E
    const cleanPrompt = this.cleanPromptForDALLE(prompt);

    console.log("AI Thumbnail Service: Cleaned prompt:", cleanPrompt);

    // Call OpenAI DALL-E API
    const response = await fetch(this.OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: cleanPrompt,
        n: 1,
        size: `${dimensions.width}x${dimensions.height}`,
        quality: "standard",
        response_format: "url",
      }),
    });

    const responseText = await response.text();
    console.log(
      "AI Thumbnail Service: OpenAI response status:",
      response.status
    );
    console.log("AI Thumbnail Service: OpenAI response body:", responseText);

    if (!response.ok) {
      let errorData: OpenAIError;
      try {
        errorData = JSON.parse(responseText) as OpenAIError;
      } catch {
        errorData = { error: { message: responseText } };
      }
      console.error("OpenAI API error:", errorData);
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = JSON.parse(responseText) as OpenAIResponse;
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    console.log("AI Thumbnail Service: OpenAI generated image URL:", imageUrl);

    // Download the image and upload to Cloudinary
    const cloudinaryResult = await this.uploadAIImageToCloudinary(
      imageUrl,
      options.style
    );

    return {
      id: `ai_thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      style: options.style,
      prompt,
    };
  }

  private static async generateWithStabilityAI(
    prompt: string,
    options: { aspectRatio: string; style: string }
  ): Promise<GeneratedThumbnail> {
    console.log("AI Thumbnail Service: Using Stability AI");

    const response = await fetch(this.STABILITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability AI API error:", errorText);
      throw new Error(`Stability AI error: ${errorText}`);
    }

    const data = (await response.json()) as StabilityAIResponse;

    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error("No image generated by Stability AI");
    }

    const imageBuffer = Buffer.from(data.artifacts[0].base64, "base64");

    // Upload to Cloudinary
    const publicId = `ai-thumbnails/stability_${options.style}_${Date.now()}`;
    const uploadResult = await CloudinaryService.uploadImageFromDataUrl(
      `data:image/png;base64,${imageBuffer.toString("base64")}`,
      {
        folder: "ai-thumbnails",
        publicId,
        transformation: {
          width: 1280,
          height: 720,
          crop: "fill",
          quality: "auto",
          format: "jpg",
        },
      }
    );

    return {
      id: `ai_thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      style: options.style,
      prompt,
    };
  }

  private static cleanPromptForDALLE(prompt: string): string {
    // Remove problematic characters and improve prompt structure
    return prompt
      .replace(/[^\w\s\-.,!?()]/g, "") // Remove special characters except basic punctuation
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()
      .substring(0, 1000); // DALL-E has a 1000 character limit
  }

  private static getDimensionsFromAspectRatio(aspectRatio: string): {
    width: number;
    height: number;
  } {
    switch (aspectRatio) {
      case "16:9":
        return { width: 1792, height: 1024 }; // DALL-E 3 supports 1792x1024
      case "1:1":
        return { width: 1024, height: 1024 };
      case "4:3":
        return { width: 1024, height: 768 };
      default:
        return { width: 1792, height: 1024 };
    }
  }

  private static async uploadAIImageToCloudinary(
    imageUrl: string,
    style: string
  ): Promise<{ url: string; publicId: string }> {
    try {
      console.log("AI Thumbnail Service: Downloading AI image from:", imageUrl);

      // Download the image from OpenAI
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download AI-generated image");
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      // Convert buffer to base64 for Cloudinary upload
      const base64 = Buffer.from(imageBuffer).toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      // Upload to Cloudinary
      const publicId = `ai-thumbnails/${style}_${Date.now()}`;
      const uploadResult = await CloudinaryService.uploadImageFromDataUrl(
        dataUrl,
        {
          folder: "ai-thumbnails",
          publicId,
          transformation: {
            width: 1280,
            height: 720,
            crop: "fill",
            quality: "auto",
            format: "jpg",
          },
        }
      );

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Error uploading to Cloudinary:",
        error
      );
      throw new Error("Failed to upload AI image to Cloudinary");
    }
  }

  static async enhanceThumbnail(
    thumbnailUrl: string,
    enhancements: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      text?: string;
      overlay?: boolean;
    }
  ): Promise<{ url: string; publicId: string }> {
    try {
      console.log("AI Thumbnail Service: Enhancing thumbnail");

      // Apply enhancements using Cloudinary transformations
      const enhancedUrl = CloudinaryService.getOptimizedUrl(thumbnailUrl, {
        width: 1280,
        height: 720,
        quality: "auto",
        format: "jpg",
        resourceType: "image",
      });

      return {
        url: enhancedUrl,
        publicId: `enhanced-thumbnails/${Date.now()}`,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: Error enhancing thumbnail:", error);
      throw new Error("Failed to enhance thumbnail");
    }
  }

  static async analyzeVideoContent(videoUrl: string): Promise<{
    dominantColors: string[];
    suggestedStyles: string[];
    recommendedText: string[];
  }> {
    try {
      console.log("AI Thumbnail Service: Analyzing video content");

      // This would analyze the video content to suggest optimal thumbnail styles
      // For now, return default suggestions
      return {
        dominantColors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
        suggestedStyles: ["modern", "bold", "minimal"],
        recommendedText: ["Click to watch!", "Must see!", "Amazing content!"],
      };
    } catch (error) {
      console.error("AI Thumbnail Service: Error analyzing video:", error);
      throw new Error("Failed to analyze video content");
    }
  }
}
