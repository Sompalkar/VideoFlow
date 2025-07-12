import { CloudinaryService } from "./CloudinaryService";
import { VideoAnalysisService } from "./VideoAnalysisService";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

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

interface OverlayOption {
  type: "text" | "emoji" | "sticker";
  content: string; // text, emoji, or Cloudinary publicId for sticker
  position?: { gravity?: string; x?: number; y?: number };
  fontSize?: number;
  fontColor?: string;
  opacity?: number;
  width?: number;
  height?: number;
}

interface BasicTransformOptions {
  style?: string;
  aspectRatio?: string;
  videoTitle?: string;
  videoDescription?: string;
  overlays?: OverlayOption[];
}

export class AIThumbnailService {
  // Validate required environment variables at startup
  private static validateApiKeys() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY environment variable is not set");
    }
    if (!process.env.STABILITY_API_KEY) {
      console.warn("STABILITY_API_KEY environment variable is not set");
    }
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.warn("HUGGINGFACE_API_KEY environment variable is not set");
    }
    if (!process.env.LEONARDO_API_KEY) {
      console.warn("LEONARDO_API_KEY environment variable is not set");
    }
  }

  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  private static readonly OPENAI_API_URL =
    "https://api.openai.com/v1/images/generations";

  // Alternative API (Stability AI) - you can add your key here
  private static readonly STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  private static readonly STABILITY_API_URL =
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

  // Initialize validation
  static {
    this.validateApiKeys();
  }

  static getOpenAISize(aspectRatio: string): string {
    if (aspectRatio === "16:9" || aspectRatio === "landscape") {
      return "1792x1024";
    } else if (aspectRatio === "9:16" || aspectRatio === "portrait") {
      return "1024x1792";
    } else {
      return "1024x1024";
    }
  }

  static getStabilityAISize(aspectRatio: string): {
    width: number;
    height: number;
  } {
    // Stability AI SDXL v1.0 supports only these exact dimensions:
    // 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152
    if (aspectRatio === "16:9" || aspectRatio === "landscape") {
      return { width: 1344, height: 768 }; // Best 16:9 approximation
    } else if (aspectRatio === "9:16" || aspectRatio === "portrait") {
      return { width: 768, height: 1344 }; // Best 9:16 approximation
    } else {
      return { width: 1024, height: 1024 }; // Square
    }
  }

  static validateStabilityAIDimensions(width: number, height: number): boolean {
    const supportedDimensions = [
      [1024, 1024],
      [1152, 896],
      [1216, 832],
      [1344, 768],
      [1536, 640],
      [640, 1536],
      [768, 1344],
      [832, 1216],
      [896, 1152],
    ];

    return supportedDimensions.some(([w, h]) => w === width && h === height);
  }

  static async generateThumbnails(
    videoUrl: string,
    title: string,
    description: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<GeneratedThumbnail[]> {
    try {
      console.log(
        "AI Thumbnail Service: Generating enhanced thumbnails for:",
        title
      );
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

      // Enhanced video content analysis for rich context
      console.log(
        "AI Thumbnail Service: Performing enhanced video analysis..."
      );
      const videoAnalysis = await VideoAnalysisService.analyzeVideo(
        videoUrl,
        title,
        description
      );

      console.log("AI Thumbnail Service: Enhanced analysis completed:", {
        category: videoAnalysis.category,
        contentType: videoAnalysis.contentType,
        targetAudience: videoAnalysis.targetAudience,
        keyTopics: videoAnalysis.keyTopics,
        emotionalTone: videoAnalysis.emotionalTone,
        visualElements: videoAnalysis.visualElements,
        brandElements: videoAnalysis.brandElements,
        trendingKeywords: videoAnalysis.trendingKeywords,
      });

      const {
        style = videoAnalysis.suggestedThumbnailElements.style,
        colors = videoAnalysis.suggestedThumbnailElements.colors,
        text = title,
        overlay = true,
        aspectRatio = "16:9",
      } = options;

      // Use supported sizes for OpenAI and Stability AI
      const openaiSize = this.getOpenAISize(aspectRatio);
      const stabilitySize = this.getStabilityAISize(aspectRatio);

      // Generate multiple thumbnail variations with enhanced context
      const thumbnails: GeneratedThumbnail[] = [];

      // Style 1: Rich Contextual Modern
      const richContextualPrompt = this.generateRichContextualPrompt(
        title,
        description,
        videoAnalysis,
        "modern",
        colors
      );

      const modernThumbnail = await this.generateWithAI(richContextualPrompt, {
        aspectRatio,
        style: "modern",
      });
      thumbnails.push(modernThumbnail);

      // Style 2: Category-Specific Enhanced
      const categoryEnhancedPrompt = this.generateCategoryEnhancedPrompt(
        title,
        description,
        videoAnalysis,
        "bold",
        colors
      );

      const boldThumbnail = await this.generateWithAI(categoryEnhancedPrompt, {
        aspectRatio,
        style: "bold",
      });
      thumbnails.push(boldThumbnail);

      // Style 3: Audience-Targeted
      const audienceTargetedPrompt = this.generateAudienceTargetedPrompt(
        title,
        description,
        videoAnalysis,
        "professional",
        colors
      );

      const professionalThumbnail = await this.generateWithAI(
        audienceTargetedPrompt,
        {
          aspectRatio,
          style: "professional",
        }
      );
      thumbnails.push(professionalThumbnail);

      // Style 4: Content-Type Specific
      const contentTypePrompt = this.generateContentTypeSpecificPrompt(
        title,
        description,
        videoAnalysis,
        "minimal",
        colors
      );

      const minimalThumbnail = await this.generateWithAI(contentTypePrompt, {
        aspectRatio,
        style: "minimal",
      });
      thumbnails.push(minimalThumbnail);

      console.log(
        `AI Thumbnail Service: Generated ${thumbnails.length} enhanced contextual thumbnails`
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

  private static generateRichContextualPrompt(
    title: string,
    description: string,
    analysis: any,
    style: string,
    colors: string[]
  ): string {
    const colorNames = colors
      .map((color) => this.getColorName(color))
      .join(", ");
    const objects = analysis.dominantObjects.slice(0, 5).join(", ");
    const category = analysis.category;
    const contentType = analysis.contentType;
    const targetAudience = analysis.targetAudience;
    const keyTopics = analysis.keyTopics.slice(0, 3).join(", ");
    const emotionalTone = analysis.emotionalTone;
    const visualElements = analysis.visualElements.slice(0, 3).join(", ");
    const brandElements = analysis.brandElements.slice(0, 2).join(", ");
    const trendingKeywords = analysis.trendingKeywords.slice(0, 3).join(", ");
    const composition = analysis.suggestedThumbnailElements.composition;
    const lighting = analysis.suggestedThumbnailElements.lighting;
    const typography = analysis.suggestedThumbnailElements.typography;
    const callToAction = analysis.suggestedThumbnailElements.callToAction;
    const backgroundStyle = analysis.suggestedThumbnailElements.backgroundStyle;
    const iconography = analysis.suggestedThumbnailElements.iconography
      .slice(0, 2)
      .join(", ");

    return `A ${style} YouTube thumbnail for "${title}" - ${contentType} content targeting ${targetAudience}. 
    Category: ${category} with ${emotionalTone} tone. Key topics: ${keyTopics}. 
    Features prominent ${objects} with ${visualElements} elements. 
    Color palette: ${colorNames} with ${lighting} lighting and ${composition} composition. 
    ${brandElements ? `Brand elements: ${brandElements}.` : ""}
    Typography: ${typography} style with clear hierarchy. 
    Background: ${backgroundStyle} with ${
      iconography ? `${iconography} icons.` : ""
    }
    Call-to-action: "${callToAction}". 
    Trending elements: ${trendingKeywords}. 
    High-quality, professional design optimized for ${category} audience engagement. 
    Modern YouTube thumbnail style with visual impact and clickability.`;
  }

  private static generateCategoryEnhancedPrompt(
    title: string,
    description: string,
    analysis: any,
    style: string,
    colors: string[]
  ): string {
    const category = analysis.category;
    const contentType = analysis.contentType;
    const objects = analysis.dominantObjects.slice(0, 4).join(", ");
    const emotionalTone = analysis.emotionalTone;
    const visualElements = analysis.visualElements.slice(0, 2).join(", ");
    const keyTopics = analysis.keyTopics.slice(0, 2).join(", ");
    const callToAction = analysis.suggestedThumbnailElements.callToAction;
    const trendingKeywords = analysis.trendingKeywords.slice(0, 2).join(", ");

    switch (category) {
      case "gaming":
        return `Epic gaming YouTube thumbnail for "${title}" - ${contentType} content. 
        Dynamic composition featuring ${objects} with ${emotionalTone} atmosphere. 
        Vibrant gaming color scheme with dramatic lighting and high contrast. 
        ${visualElements} elements for visual impact. 
        Key gaming topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending gaming elements: ${trendingKeywords}. 
        Action-packed design perfect for gaming audience with dramatic shadows and RGB effects. 
        Professional gaming thumbnail style optimized for click-through rates.`;

      case "education":
        return `Educational YouTube thumbnail for "${title}" - ${contentType} content. 
        Clean, professional design featuring ${objects} with ${emotionalTone} tone. 
        Educational color palette with clear, readable typography and visual hierarchy. 
        ${visualElements} elements for learning engagement. 
        Key educational topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Perfect for learning content with structured layout and professional appearance. 
        Modern educational thumbnail style that builds trust and credibility.`;

      case "review":
        return `Product review YouTube thumbnail for "${title}" - ${contentType} content. 
        Professional review layout featuring ${objects} with ${emotionalTone} presentation. 
        Review-focused color scheme with clear product visibility and rating elements. 
        ${visualElements} elements for review credibility. 
        Key review topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending review elements: ${trendingKeywords}. 
        Trust-building design with clear product shots and honest review indicators. 
        Professional review thumbnail style optimized for consumer trust.`;

      case "news":
        return `Breaking news YouTube thumbnail for "${title}" - ${contentType} content. 
        Urgent news layout featuring ${objects} with ${emotionalTone} urgency. 
        News color scheme with breaking news elements and urgency indicators. 
        ${visualElements} elements for news credibility. 
        Key news topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending news elements: ${trendingKeywords}. 
        Professional news thumbnail style with urgency and credibility indicators.`;

      case "music":
        return `Music YouTube thumbnail for "${title}" - ${contentType} content. 
        Musical composition featuring ${objects} with ${emotionalTone} musical atmosphere. 
        Musical color palette with rhythm and melody visual elements. 
        ${visualElements} elements for musical engagement. 
        Key music topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending music elements: ${trendingKeywords}. 
        Artistic music thumbnail style with rhythm and visual harmony.`;

      case "cooking":
        return `Cooking YouTube thumbnail for "${title}" - ${contentType} content. 
        Culinary composition featuring ${objects} with ${emotionalTone} food atmosphere. 
        Appetizing color palette with fresh ingredients and cooking elements. 
        ${visualElements} elements for culinary appeal. 
        Key cooking topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending cooking elements: ${trendingKeywords}. 
        Appetizing cooking thumbnail style with fresh ingredients and culinary appeal.`;

      case "travel":
        return `Travel YouTube thumbnail for "${title}" - ${contentType} content. 
        Adventure composition featuring ${objects} with ${emotionalTone} travel atmosphere. 
        Travel color palette with destination elements and adventure indicators. 
        ${visualElements} elements for travel inspiration. 
        Key travel topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending travel elements: ${trendingKeywords}. 
        Inspiring travel thumbnail style with destination appeal and adventure elements.`;

      case "technology":
        return `Technology YouTube thumbnail for "${title}" - ${contentType} content. 
        Tech composition featuring ${objects} with ${emotionalTone} tech atmosphere. 
        Tech color palette with digital elements and innovation indicators. 
        ${visualElements} elements for tech credibility. 
        Key tech topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending tech elements: ${trendingKeywords}. 
        Professional tech thumbnail style with innovation and digital appeal.`;

      case "fitness":
        return `Fitness YouTube thumbnail for "${title}" - ${contentType} content. 
        Energetic composition featuring ${objects} with ${emotionalTone} fitness atmosphere. 
        Energetic color palette with workout elements and motivation indicators. 
        ${visualElements} elements for fitness motivation. 
        Key fitness topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending fitness elements: ${trendingKeywords}. 
        Motivational fitness thumbnail style with energy and workout appeal.`;

      case "business":
        return `Business YouTube thumbnail for "${title}" - ${contentType} content. 
        Professional composition featuring ${objects} with ${emotionalTone} business atmosphere. 
        Professional color palette with corporate elements and success indicators. 
        ${visualElements} elements for business credibility. 
        Key business topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending business elements: ${trendingKeywords}. 
        Professional business thumbnail style with corporate appeal and success indicators.`;

      default:
        return `Professional YouTube thumbnail for "${title}" - ${contentType} content. 
        Balanced composition featuring ${objects} with ${emotionalTone} atmosphere. 
        Versatile color palette with ${visualElements} elements. 
        Key topics: ${keyTopics}. 
        Call-to-action: "${callToAction}". 
        Trending elements: ${trendingKeywords}. 
        Professional thumbnail style optimized for general audience engagement.`;
    }
  }

  private static generateAudienceTargetedPrompt(
    title: string,
    description: string,
    analysis: any,
    style: string,
    colors: string[]
  ): string {
    const targetAudience = analysis.targetAudience;
    const category = analysis.category;
    const contentType = analysis.contentType;
    const objects = analysis.dominantObjects.slice(0, 3).join(", ");
    const emotionalTone = analysis.emotionalTone;
    const keyTopics = analysis.keyTopics.slice(0, 2).join(", ");
    const visualElements = analysis.visualElements.slice(0, 2).join(", ");

    switch (targetAudience) {
      case "beginners":
        return `Beginner-friendly YouTube thumbnail for "${title}" - ${contentType} content. 
        Simple, clear design featuring ${objects} with approachable ${emotionalTone} tone. 
        Beginner-appropriate color palette with clear visual hierarchy. 
        ${visualElements} elements for easy understanding. 
        Key beginner topics: ${keyTopics}. 
        Friendly, welcoming design perfect for ${category} beginners. 
        Clear, simple layout that doesn't overwhelm new viewers. 
        Encouraging thumbnail style that builds confidence and accessibility.`;

      case "advanced users":
        return `Advanced YouTube thumbnail for "${title}" - ${contentType} content. 
        Sophisticated design featuring ${objects} with professional ${emotionalTone} tone. 
        Advanced color palette with complex visual elements. 
        ${visualElements} elements for expert-level engagement. 
        Key advanced topics: ${keyTopics}. 
        Professional, detailed design perfect for ${category} experts. 
        Complex layout that appeals to knowledgeable viewers. 
        Sophisticated thumbnail style that demonstrates expertise and depth.`;

      case "family":
        return `Family-friendly YouTube thumbnail for "${title}" - ${contentType} content. 
        Wholesome design featuring ${objects} with positive ${emotionalTone} tone. 
        Family-appropriate color palette with safe visual elements. 
        ${visualElements} elements for family engagement. 
        Key family topics: ${keyTopics}. 
        Safe, positive design perfect for family viewing. 
        Clean, wholesome layout that parents can trust. 
        Family-friendly thumbnail style with positive messaging and safe content.`;

      case "teens":
        return `Teen-focused YouTube thumbnail for "${title}" - ${contentType} content. 
        Trendy design featuring ${objects} with energetic ${emotionalTone} tone. 
        Teen-appropriate color palette with modern visual elements. 
        ${visualElements} elements for teen engagement. 
        Key teen topics: ${keyTopics}. 
        Cool, trendy design perfect for teen audience. 
        Modern layout that appeals to youth culture. 
        Teen-friendly thumbnail style with current trends and youthful energy.`;

      case "adults":
        return `Adult-focused YouTube thumbnail for "${title}" - ${contentType} content. 
        Mature design featuring ${objects} with sophisticated ${emotionalTone} tone. 
        Adult-appropriate color palette with professional visual elements. 
        ${visualElements} elements for adult engagement. 
        Key adult topics: ${keyTopics}. 
        Sophisticated design perfect for adult audience. 
        Professional layout that respects mature viewers. 
        Adult-oriented thumbnail style with sophistication and professionalism.`;

      default:
        return `General audience YouTube thumbnail for "${title}" - ${contentType} content. 
        Universal design featuring ${objects} with balanced ${emotionalTone} tone. 
        Versatile color palette with broad appeal visual elements. 
        ${visualElements} elements for general engagement. 
        Key topics: ${keyTopics}. 
        Accessible design perfect for general audience. 
        Balanced layout that appeals to diverse viewers. 
        Universal thumbnail style with broad appeal and accessibility.`;
    }
  }

  private static generateContentTypeSpecificPrompt(
    title: string,
    description: string,
    analysis: any,
    style: string,
    colors: string[]
  ): string {
    const contentType = analysis.contentType;
    const category = analysis.category;
    const objects = analysis.dominantObjects.slice(0, 3).join(", ");
    const emotionalTone = analysis.emotionalTone;
    const keyTopics = analysis.keyTopics.slice(0, 2).join(", ");
    const visualElements = analysis.visualElements.slice(0, 2).join(", ");

    switch (contentType) {
      case "tutorial":
        return `Tutorial YouTube thumbnail for "${title}" - ${category} content. 
        Educational design featuring ${objects} with clear ${emotionalTone} instruction. 
        Tutorial-appropriate color palette with step-by-step visual elements. 
        ${visualElements} elements for learning clarity. 
        Key tutorial topics: ${keyTopics}. 
        Clear, instructional design perfect for learning content. 
        Structured layout that guides viewers through the learning process. 
        Educational thumbnail style with clear progression and learning indicators.`;

      case "review":
        return `Review YouTube thumbnail for "${title}" - ${category} content. 
        Analytical design featuring ${objects} with objective ${emotionalTone} assessment. 
        Review-appropriate color palette with rating and comparison elements. 
        ${visualElements} elements for review credibility. 
        Key review topics: ${keyTopics}. 
        Honest, analytical design perfect for review content. 
        Balanced layout that presents fair assessment. 
        Review thumbnail style with credibility and objectivity indicators.`;

      case "vlog":
        return `Vlog YouTube thumbnail for "${title}" - ${category} content. 
        Personal design featuring ${objects} with authentic ${emotionalTone} connection. 
        Vlog-appropriate color palette with personal and relatable elements. 
        ${visualElements} elements for personal engagement. 
        Key vlog topics: ${keyTopics}. 
        Authentic, personal design perfect for vlog content. 
        Relatable layout that builds viewer connection. 
        Vlog thumbnail style with authenticity and personal touch.`;

      case "interview":
        return `Interview YouTube thumbnail for "${title}" - ${category} content. 
        Conversational design featuring ${objects} with engaging ${emotionalTone} dialogue. 
        Interview-appropriate color palette with discussion and conversation elements. 
        ${visualElements} elements for interview engagement. 
        Key interview topics: ${keyTopics}. 
        Engaging, conversational design perfect for interview content. 
        Interactive layout that encourages viewer participation. 
        Interview thumbnail style with dialogue and engagement indicators.`;

      case "unboxing":
        return `Unboxing YouTube thumbnail for "${title}" - ${category} content. 
        Revealing design featuring ${objects} with exciting ${emotionalTone} discovery. 
        Unboxing-appropriate color palette with surprise and reveal elements. 
        ${visualElements} elements for unboxing excitement. 
        Key unboxing topics: ${keyTopics}. 
        Exciting, revealing design perfect for unboxing content. 
        Anticipation-building layout that creates viewer excitement. 
        Unboxing thumbnail style with surprise and discovery elements.`;

      case "challenge":
        return `Challenge YouTube thumbnail for "${title}" - ${category} content. 
        Dynamic design featuring ${objects} with energetic ${emotionalTone} challenge. 
        Challenge-appropriate color palette with action and competition elements. 
        ${visualElements} elements for challenge excitement. 
        Key challenge topics: ${keyTopics}. 
        Energetic, competitive design perfect for challenge content. 
        Action-packed layout that creates viewer excitement. 
        Challenge thumbnail style with energy and competition indicators.`;

      case "reaction":
        return `Reaction YouTube thumbnail for "${title}" - ${category} content. 
        Expressive design featuring ${objects} with emotional ${emotionalTone} response. 
        Reaction-appropriate color palette with emotion and expression elements. 
        ${visualElements} elements for reaction engagement. 
        Key reaction topics: ${keyTopics}. 
        Expressive, emotional design perfect for reaction content. 
        Emotion-driven layout that captures viewer attention. 
        Reaction thumbnail style with emotion and expression indicators.`;

      default:
        return `General content YouTube thumbnail for "${title}" - ${category} content. 
        Versatile design featuring ${objects} with balanced ${emotionalTone} tone. 
        General color palette with broad appeal elements. 
        ${visualElements} elements for general engagement. 
        Key topics: ${keyTopics}. 
        Balanced design perfect for general content. 
        Universal layout that appeals to diverse viewers. 
        General thumbnail style with broad appeal and accessibility.`;
    }
  }

  private static getColorName(hexColor: string): string {
    const colorMap: { [key: string]: string } = {
      "#FF6B6B": "coral red",
      "#4ECDC4": "turquoise",
      "#45B7D1": "sky blue",
      "#96CEB4": "mint green",
      "#FFEAA7": "soft yellow",
      "#DDA0DD": "plum",
      "#2E86AB": "ocean blue",
      "#A23B72": "deep pink",
      "#F18F01": "orange",
      "#C73E1D": "rust red",
      "#6A994E": "forest green",
      "#A7C957": "lime green",
      "#FFD700": "gold",
      "#FF6B35": "bright orange",
      "#004E89": "navy blue",
      "#FF8C00": "dark orange",
      "#FF1493": "deep pink",
      "#00CED1": "dark turquoise",
      "#DC143C": "crimson",
      "#000080": "navy",
      "#FF4500": "orange red",
      "#8B0000": "dark red",
      "#0000CD": "medium blue",
      "#8B5CF6": "violet",
      "#EC4899": "pink",
      "#F59E0B": "amber",
      "#10B981": "emerald",
      "#3B82F6": "blue",
      "#EF4444": "red",
      "#87CEEB": "sky blue",
      "#98FB98": "pale green",
      "#F0E68C": "khaki",
      "#FFB6C1": "light pink",
      "#F0F8FF": "alice blue",
      "#4169E1": "royal blue",
      "#32CD32": "lime green",
      "#FF6347": "tomato",
      "#9370DB": "medium purple",
      "#20B2AA": "light sea green",
      "#2F4F4F": "dark slate gray",
      "#696969": "dim gray",
      "#708090": "slate gray",
      "#B0C4DE": "light steel blue",
      "#F5F5DC": "beige",
    };

    return colorMap[hexColor] || "color";
  }

  public static async generateWithAI(
    prompt: string,
    options: { aspectRatio: string; style: string; apiKey?: string }
  ): Promise<GeneratedThumbnail> {
    try {
      console.log(
        `AI Thumbnail Service: Generating ${options.style} thumbnail with enhanced prompt`
      );
      console.log(
        "AI Thumbnail Service: Prompt preview:",
        prompt.substring(0, 100) + "..."
      );

      // Try Stability AI first (more reliable for thumbnails)
      try {
        return await this.generateWithStabilityAI("", prompt, options);
      } catch (stabilityError) {
        console.log(
          "AI Thumbnail Service: Stability AI failed, trying OpenAI..."
        );
        console.log(
          "AI Thumbnail Service: Stability AI error:",
          stabilityError instanceof Error
            ? stabilityError.message
            : String(stabilityError)
        );

        try {
          return await this.generateWithOpenAI(prompt, options);
        } catch (openaiError) {
          console.error(
            "AI Thumbnail Service: Both Stability AI and OpenAI failed"
          );
          console.error(
            "AI Thumbnail Service: OpenAI error:",
            openaiError instanceof Error
              ? openaiError.message
              : String(openaiError)
          );
          throw new Error("Failed to generate thumbnail with both AI services");
        }
      }
    } catch (error) {
      console.error("AI Thumbnail Service: Error in AI generation:", error);
      throw new Error("Failed to generate thumbnail with AI");
    }
  }

  private static async generateWithOpenAI(
    prompt: string,
    options: { aspectRatio: string; style: string; apiKey?: string }
  ): Promise<GeneratedThumbnail> {
    try {
      const openaiSize = this.getOpenAISize(options.aspectRatio);
      const cleanedPrompt = this.cleanPromptForDALLE(prompt);

      console.log(`AI Thumbnail Service: OpenAI request - Size: ${openaiSize}`);

      const response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey || this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: cleanedPrompt,
          n: 1,
          size: openaiSize,
          quality: "hd",
          style: "vivid",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        console.error(
          "AI Thumbnail Service: OpenAI API error details:",
          errorData
        );
        throw new Error(
          `OpenAI API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = (await response.json()) as any;
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL received from OpenAI");
      }

      console.log("AI Thumbnail Service: OpenAI generation successful");

      // Upload to Cloudinary
      const uploadResult = await this.uploadAIImageToCloudinary(
        imageUrl,
        options.style
      );

      return {
        id: `openai-${Date.now()}`,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        style: options.style,
        prompt: cleanedPrompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: OpenAI generation failed:", error);
      throw error;
    }
  }

  private static async generateWithStabilityAI(
    framePathOrUrl: string,
    prompt: string,
    options: {
      aspectRatio: string;
      style: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    }
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.STABILITY_API_KEY;
      if (!apiKey) {
        throw new Error("No Stability AI API key provided");
      }

      console.log(
        "AI Thumbnail Service: Using Stability AI for image enhancement..."
      );

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Convert image to base64
      const imageBase64 = imageBuffer.toString("base64");

      // Create focused prompt for text overlay and color enhancement only
      const enhancedPrompt = this.createFocusedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log("AI Thumbnail Service: Enhanced prompt:", enhancedPrompt);

      // Use Stability AI's image-to-image endpoint with correct model
      const payload = {
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1,
          },
        ],
        init_image: imageBase64,
        init_image_mode: "IMAGE_STRENGTH",
        image_strength: 0.03, // Extremely low strength (97% original content)
        cfg_scale: 2, // Very low CFG for minimal changes
        steps: 15, // Fewer steps for subtle changes
        samples: 1,
      };

      console.log("AI Thumbnail Service: Sending request to Stability AI...");

      // Try different Stability AI endpoints with proper dimensions
      const endpoints = [
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/image-to-image",
          width: 768,
          height: 768,
        },
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/image-to-image",
          width: 512,
          height: 512,
        },
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
          width: 1024,
          height: 1024,
        },
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`AI Thumbnail Service: Trying endpoint: ${endpoint.url}`);

          // Resize image to acceptable dimensions using Cloudinary
          const resizedImageUrl = CloudinaryService.getOptimizedUrl(
            framePathOrUrl,
            {
              transformation: {
                width: endpoint.width,
                height: endpoint.height,
                crop: "fill",
                quality: "auto",
              },
            }
          );

          // Download the resized image
          const resizedResponse = await fetch(resizedImageUrl);
          if (!resizedResponse.ok) {
            throw new Error(
              `Failed to download resized image: ${resizedResponse.statusText}`
            );
          }
          const resizedBuffer = Buffer.from(
            await resizedResponse.arrayBuffer()
          );

          // Create FormData for multipart/form-data
          const form = new FormData();
          form.append("text_prompts[0][text]", enhancedPrompt);
          form.append("text_prompts[0][weight]", "1");
          form.append("init_image", resizedBuffer, {
            filename: "init_image.jpg",
            contentType: "image/jpeg",
          });
          form.append("init_image_mode", "IMAGE_STRENGTH");
          form.append("image_strength", "0.15"); // Very low strength
          form.append("cfg_scale", "6"); // Lower CFG
          form.append("steps", "30");
          form.append("samples", "1");

          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              ...form.getHeaders(),
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: form,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(
              `AI Thumbnail Service: Endpoint ${endpoint.url} failed:`,
              errorText
            );
            lastError = new Error(
              `Stability AI error (${response.status}): ${errorText}`
            );
            continue; // Try next endpoint
          }

          console.log("AI Thumbnail Service: Stability AI API call successful");

          const data = (await response.json()) as any;
          const artifact = data.artifacts?.[0];

          if (!artifact || !artifact.base64) {
            throw new Error("No image data received from Stability AI");
          }

          console.log(
            "AI Thumbnail Service: Stability AI generation successful"
          );

          // Convert base64 to buffer and upload to Cloudinary
          const enhancedImageBuffer = Buffer.from(artifact.base64, "base64");

          // Upload to Cloudinary
          const uploadResult = await CloudinaryService.uploadBuffer(
            enhancedImageBuffer,
            {
              folder: "ai-thumbnails",
              public_id: `ai_${Date.now()}`, // Simplified naming
              resource_type: "image",
            }
          );

          // Add post-processing text overlay if video title exists
          if (options.videoTitle) {
            console.log(
              "AI Thumbnail Service: Adding post-processing text overlay..."
            );

            const finalUrl = CloudinaryService.getOverlayedImageUrl(
              uploadResult.public_id,
              {
                text: options.videoTitle,
                fontFamily: "Impact",
                fontSize: 85,
                fontColor: "#FFFFFF",
                position: { gravity: "south", x: 0, y: 35 },
                background: "rgba(0,0,0,0.8)",
                opacity: 0.9,
                width: 1100,
                height: 150,
              }
            );

            console.log(
              "AI Thumbnail Service: Post-processing text overlay added"
            );

            // Test if the complex URL is accessible, fallback to simple URL if not
            const isAccessible = await this.testImageAccessibility(finalUrl);
            const finalImageUrl = isAccessible
              ? finalUrl
              : this.getSimpleImageUrl(uploadResult.public_id);

            return {
              id: `stability-${Date.now()}`,
              url: finalImageUrl,
              publicId: uploadResult.public_id,
              style: options.style || "enhanced",
              prompt: prompt,
            };
          }

          // Return the enhanced image without overlay
          const optimizedUrl = CloudinaryService.getOptimizedUrl(
            uploadResult.public_id,
            {
              transformation: {
                quality: "auto",
                format: "auto",
              },
            }
          );

          // Test if the optimized URL is accessible, fallback to simple URL if not
          const isAccessible = await this.testImageAccessibility(optimizedUrl);
          const finalImageUrl = isAccessible
            ? optimizedUrl
            : this.getSimpleImageUrl(uploadResult.public_id);

          return {
            id: `stability-${Date.now()}`,
            url: finalImageUrl,
            publicId: uploadResult.public_id,
            style: options.style || "enhanced",
            prompt: prompt,
          };
        } catch (error) {
          console.log(
            `AI Thumbnail Service: Endpoint ${endpoint.url} error:`,
            error
          );
          lastError = error as Error;
          continue; // Try next endpoint
        }
      }

      // If all endpoints failed, throw the last error
      if (lastError) {
        throw lastError;
      }

      throw new Error("All Stability AI endpoints failed");
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Stability AI fallback error:",
        error
      );
      throw error;
    }
  }

  private static cleanPromptForDALLE(prompt: string): string {
    // Clean and optimize prompt for DALL-E
    return prompt
      .replace(/[^\w\s\-.,!?()]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .substring(0, 1000); // Limit length
  }

  private static async uploadAIImageToCloudinary(
    imageUrl: string,
    style: string
  ): Promise<{ url: string; publicId: string }> {
    try {
      console.log("AI Thumbnail Service: Downloading AI-generated image...");

      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      console.log("AI Thumbnail Service: Uploading to Cloudinary...");

      // Convert buffer to data URL and upload
      const base64 = buffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      const uploadResult = await CloudinaryService.uploadImageFromDataUrl(
        dataUrl,
        {
          folder: "thumbnails",
          publicId: `ai-${style}-${Date.now()}`,
        }
      );

      console.log("AI Thumbnail Service: Cloudinary upload successful");

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Error uploading to Cloudinary:",
        error
      );
      throw new Error("Failed to upload AI thumbnail to Cloudinary");
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
      console.log("AI Thumbnail Service: Enhancing thumbnail...");

      const transformation = {
        brightness: enhancements.brightness || 0,
        contrast: enhancements.contrast || 0,
        saturation: enhancements.saturation || 0,
      };

      const enhancedUrl = await CloudinaryService.transformImage(
        thumbnailUrl,
        transformation
      );

      return {
        url: enhancedUrl,
        publicId: thumbnailUrl, // Keep original public ID
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
      console.log("AI Thumbnail Service: Analyzing video content...");

      // This would typically involve frame extraction and analysis
      // For now, return default values
      return {
        dominantColors: ["#3B82F6", "#EF4444", "#10B981"],
        suggestedStyles: ["modern", "bold", "professional"],
        recommendedText: ["Watch Now", "Learn More", "Discover"],
      };
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Error analyzing video content:",
        error
      );
      throw new Error("Failed to analyze video content");
    }
  }

  /**
   * Enhance a frame using AI (prioritizing Stability AI)
   */
  static async enhanceFrameWithImg2Img(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      strength?: number;
      guidanceScale?: number;
      videoTitle?: string;
      videoDescription?: string;
      service?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      console.log(
        "AI Thumbnail Service: Starting frame enhancement with img2img..."
      );
      console.log("AI Thumbnail Service: Frame URL:", framePathOrUrl);
      console.log("AI Thumbnail Service: Prompt:", prompt);
      console.log("AI Thumbnail Service: Options:", options);

      // Determine which service to use
      const service = options.service || "stability"; // Default to Stability AI

      let result: GeneratedThumbnail;

      switch (service.toLowerCase()) {
        case "stability":
          console.log("AI Thumbnail Service: Using Stability AI...");
          result = await this.enhanceFrameWithStabilityAI(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "huggingface":
          console.log("AI Thumbnail Service: Using HuggingFace...");
          result = await this.enhanceFrameWithHuggingFace(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "leonardo":
          console.log("AI Thumbnail Service: Using Leonardo AI...");
          result = await this.enhanceFrameWithLeonardoAI(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "dalle":
          console.log("AI Thumbnail Service: Using DALL-E 3...");
          result = await this.enhanceFrameWithDALLE3(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "dalle-hybrid":
          console.log("AI Thumbnail Service: Using DALL-E 3 Hybrid...");
          result = await this.enhanceFrameWithDALLE3Hybrid(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "precise":
          console.log("AI Thumbnail Service: Using Precise Control...");
          result = await this.enhanceFrameWithPreciseControl(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "preservation":
          console.log("AI Thumbnail Service: Using Content Preservation...");
          result = await this.enhanceFrameWithPreservation(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "mock":
          console.log("AI Thumbnail Service: Using Mock AI...");
          result = await this.enhanceFrameWithMockAI(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        case "basic":
          console.log("AI Thumbnail Service: Using Basic Transformations...");
          result = await this.enhanceFrameWithBasicTransformations(
            framePathOrUrl,
            prompt,
            options
          );
          break;
        default:
          console.log("AI Thumbnail Service: Using Stability AI (default)...");
          result = await this.enhanceFrameWithStabilityAI(
            framePathOrUrl,
            prompt,
            options
          );
          break;
      }

      console.log(
        "AI Thumbnail Service: Frame enhancement completed successfully"
      );
      return result;
    } catch (error) {
      console.error("AI Thumbnail Service: Frame enhancement error:", error);

      // Fallback to basic transformations
      console.log(
        "AI Thumbnail Service: Falling back to basic transformations..."
      );
      try {
        return await this.enhanceFrameWithBasicTransformations(
          framePathOrUrl,
          prompt,
          options
        );
      } catch (fallbackError) {
        console.error(
          "AI Thumbnail Service: Fallback also failed:",
          fallbackError
        );
        throw new Error("All enhancement methods failed");
      }
    }
  }

  /**
   * HuggingFace img2img enhancement (kept as fallback)
   */
  private static async enhanceFrameWithHuggingFace(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      strength?: number;
      guidanceScale?: number;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        throw new Error("No HuggingFace API key provided");
      }

      console.log(
        "AI Thumbnail Service: Using HuggingFace for image enhancement..."
      );

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Convert image to base64
      const imageBase64 = imageBuffer.toString("base64");

      // Create enhanced prompt
      const enhancedPrompt = this.createEnhancedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log(
        "AI Thumbnail Service: Enhanced prompt for HuggingFace:",
        enhancedPrompt
      );

      // Use HuggingFace's img2img endpoint
      const response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              image: imageBase64,
              strength: options.strength || 0.75,
              guidance_scale: options.guidanceScale || 7.5,
              num_inference_steps: 50,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("AI Thumbnail Service: HuggingFace error:", errorText);
        throw new Error(`HuggingFace error: ${errorText}`);
      }

      console.log("AI Thumbnail Service: HuggingFace API call successful");

      const imageBuffer2 = await response.arrayBuffer();
      const enhancedImageBuffer = Buffer.from(imageBuffer2);

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadBuffer(
        enhancedImageBuffer,
        {
          folder: "ai-thumbnails",
          public_id: `huggingface_enhanced_${Date.now()}`,
          resource_type: "image",
        }
      );

      return {
        id: `huggingface-${Date.now()}`,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        style: options.style || "huggingface",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: HuggingFace error:", error);
      throw error;
    }
  }

  /**
   * Fallback method using Stability AI for frame enhancement
   */
  private static async enhanceFrameWithStabilityAI(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.STABILITY_API_KEY;
      if (!apiKey) {
        throw new Error("No Stability AI API key provided");
      }

      console.log(
        "AI Thumbnail Service: Using Stability AI for image enhancement..."
      );

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Convert image to base64
      const imageBase64 = imageBuffer.toString("base64");

      // Create focused prompt for text overlay and color enhancement only
      const enhancedPrompt = this.createFocusedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log("AI Thumbnail Service: Enhanced prompt:", enhancedPrompt);

      // Use Stability AI's image-to-image endpoint with correct model
      const payload = {
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1,
          },
        ],
        init_image: imageBase64,
        init_image_mode: "IMAGE_STRENGTH",
        image_strength: 0.03, // Extremely low strength (97% original content)
        cfg_scale: 2, // Very low CFG for minimal changes
        steps: 15, // Fewer steps for subtle changes
        samples: 1,
      };

      console.log("AI Thumbnail Service: Sending request to Stability AI...");

      // Try different Stability AI endpoints with proper dimensions
      const endpoints = [
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/image-to-image",
          width: 768,
          height: 768,
        },
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/image-to-image",
          width: 512,
          height: 512,
        },
        {
          url: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
          width: 1024,
          height: 1024,
        },
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`AI Thumbnail Service: Trying endpoint: ${endpoint.url}`);

          // Resize image to acceptable dimensions using Cloudinary
          const resizedImageUrl = CloudinaryService.getOptimizedUrl(
            framePathOrUrl,
            {
              transformation: {
                width: endpoint.width,
                height: endpoint.height,
                crop: "fill",
                quality: "auto",
              },
            }
          );

          // Download the resized image
          const resizedResponse = await fetch(resizedImageUrl);
          if (!resizedResponse.ok) {
            throw new Error(
              `Failed to download resized image: ${resizedResponse.statusText}`
            );
          }
          const resizedBuffer = Buffer.from(
            await resizedResponse.arrayBuffer()
          );

          // Create FormData for multipart/form-data
          const form = new FormData();
          form.append("text_prompts[0][text]", enhancedPrompt);
          form.append("text_prompts[0][weight]", "1");
          form.append("init_image", resizedBuffer, {
            filename: "init_image.jpg",
            contentType: "image/jpeg",
          });
          form.append("init_image_mode", "IMAGE_STRENGTH");
          form.append("image_strength", "0.15"); // Very low strength
          form.append("cfg_scale", "6"); // Lower CFG
          form.append("steps", "30");
          form.append("samples", "1");

          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              ...form.getHeaders(),
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: form,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(
              `AI Thumbnail Service: Endpoint ${endpoint.url} failed:`,
              errorText
            );
            lastError = new Error(
              `Stability AI error (${response.status}): ${errorText}`
            );
            continue; // Try next endpoint
          }

          console.log("AI Thumbnail Service: Stability AI API call successful");

          const data = (await response.json()) as any;
          const artifact = data.artifacts?.[0];

          if (!artifact || !artifact.base64) {
            throw new Error("No image data received from Stability AI");
          }

          console.log(
            "AI Thumbnail Service: Stability AI generation successful"
          );

          // Convert base64 to buffer and upload to Cloudinary
          const enhancedImageBuffer = Buffer.from(artifact.base64, "base64");

          // Upload to Cloudinary
          const uploadResult = await CloudinaryService.uploadBuffer(
            enhancedImageBuffer,
            {
              folder: "ai-thumbnails",
              public_id: `ai_${Date.now()}`, // Simplified naming
              resource_type: "image",
            }
          );

          // Add post-processing text overlay if video title exists
          if (options.videoTitle) {
            console.log(
              "AI Thumbnail Service: Adding post-processing text overlay..."
            );

            const finalUrl = CloudinaryService.getOverlayedImageUrl(
              uploadResult.public_id,
              {
                text: options.videoTitle,
                fontFamily: "Impact",
                fontSize: 85,
                fontColor: "#FFFFFF",
                position: { gravity: "south", x: 0, y: 35 },
                background: "rgba(0,0,0,0.8)",
                opacity: 0.9,
                width: 1100,
                height: 150,
              }
            );

            console.log(
              "AI Thumbnail Service: Post-processing text overlay added"
            );

            // Test if the complex URL is accessible, fallback to simple URL if not
            const isAccessible = await this.testImageAccessibility(finalUrl);
            const finalImageUrl = isAccessible
              ? finalUrl
              : this.getSimpleImageUrl(uploadResult.public_id);

            return {
              id: `stability-${Date.now()}`,
              url: finalImageUrl,
              publicId: uploadResult.public_id,
              style: options.style || "enhanced",
              prompt: prompt,
            };
          }

          // Return the enhanced image without overlay
          const optimizedUrl = CloudinaryService.getOptimizedUrl(
            uploadResult.public_id,
            {
              transformation: {
                quality: "auto",
                format: "auto",
              },
            }
          );

          // Test if the optimized URL is accessible, fallback to simple URL if not
          const isAccessible = await this.testImageAccessibility(optimizedUrl);
          const finalImageUrl = isAccessible
            ? optimizedUrl
            : this.getSimpleImageUrl(uploadResult.public_id);

          return {
            id: `stability-${Date.now()}`,
            url: finalImageUrl,
            publicId: uploadResult.public_id,
            style: options.style || "enhanced",
            prompt: prompt,
          };
        } catch (error) {
          console.log(
            `AI Thumbnail Service: Endpoint ${endpoint.url} error:`,
            error
          );
          lastError = error as Error;
          continue; // Try next endpoint
        }
      }

      // If all endpoints failed, throw the last error
      if (lastError) {
        throw lastError;
      }

      throw new Error("All Stability AI endpoints failed");
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Stability AI fallback error:",
        error
      );
      throw error;
    }
  }

  /**
   * Mock AI enhancement for testing (no API keys required)
   */
  private static async enhanceFrameWithMockAI(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      console.log("AI Thumbnail Service: Using mock AI for testing...");

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Upload original image to Cloudinary (mock enhancement)
      const uploadResult = await CloudinaryService.uploadBuffer(imageBuffer, {
        folder: "ai-thumbnails",
        public_id: `mock_enhanced_${Date.now()}`,
        resource_type: "image",
      });

      // Add text overlay if video title exists
      if (options.videoTitle) {
        console.log("AI Thumbnail Service: Adding mock text overlay...");

        const finalUrl = CloudinaryService.getOverlayedImageUrl(
          uploadResult.public_id,
          {
            text: options.videoTitle,
            fontFamily: "Impact",
            fontSize: 85,
            fontColor: "#FFFFFF",
            position: { gravity: "south", x: 0, y: 35 },
            background: "rgba(0,0,0,0.8)",
            opacity: 0.9,
            width: 1100,
            height: 150,
          }
        );

        return {
          id: `mock-${Date.now()}`,
          url: finalUrl,
          publicId: uploadResult.public_id,
          style: options.style || "mock",
          prompt: prompt,
        };
      }

      return {
        id: `mock-${Date.now()}`,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        style: options.style || "mock",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: Mock AI error:", error);
      throw error;
    }
  }

  /**
   * Create enhanced prompt with video context
   */
  private static createEnhancedPrompt(
    userPrompt: string,
    videoTitle?: string,
    videoDescription?: string
  ): string {
    let enhancedPrompt = userPrompt;

    // Add video context if available
    if (videoTitle || videoDescription) {
      enhancedPrompt += ` Video title: "${
        videoTitle || ""
      }". Video description: "${videoDescription || ""}".`;
    }

    // Add quality enhancement instructions
    enhancedPrompt += ` Create a professional YouTube thumbnail with: vibrant colors, sharp details, professional text overlay, high contrast, cinematic lighting, 4K quality, engaging visual appeal. Make it highly click-worthy and professional.`;

    // Add specific enhancement for thumbnails
    enhancedPrompt += ` Style: professional photography, bold typography, modern design, high saturation, dramatic lighting.`;

    return enhancedPrompt;
  }

  /**
   * Simple fallback enhancement using basic image transformations and text overlay
   */
  static async enhanceFrameWithBasicTransformations(
    framePathOrUrl: string,
    prompt: string,
    options: BasicTransformOptions = {}
  ): Promise<GeneratedThumbnail> {
    try {
      console.log("AI Thumbnail Service: Using basic transformations...");

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Upload original image to Cloudinary
      const uploadResult = await CloudinaryService.uploadBuffer(imageBuffer, {
        folder: "ai-thumbnails",
        public_id: `basic_${Date.now()}`,
        resource_type: "image",
      });

      // Start with the original image publicId
      let publicId = uploadResult.public_id;
      let transformation: any = {
        brightness: 1, // extremely subtle
        contrast: 2, // extremely subtle
        saturation: 2, // extremely subtle
        quality: 95,
        format: "jpg",
        effect: "sharpen:20", // extremely subtle
      };

      // Build up overlays if provided
      let overlayTransformations: any[] = [];
      if (options.overlays && Array.isArray(options.overlays)) {
        for (const overlay of options.overlays) {
          if (overlay.type === "text" || overlay.type === "emoji") {
            overlayTransformations.push({
              overlay: {
                font_family: "Arial",
                font_size: overlay.fontSize || 32,
                text: overlay.content,
                font_weight: "normal",
                font_color: overlay.fontColor || "#FFFFFF",
              },
              gravity: overlay.position?.gravity || "south_east",
              x: overlay.position?.x || 20,
              y: overlay.position?.y || 20,
              opacity: overlay.opacity || 0.7,
              width: overlay.width || 120,
              height: overlay.height || 60,
            });
          } else if (overlay.type === "sticker") {
            overlayTransformations.push({
              overlay: overlay.content, // Cloudinary publicId for sticker
              gravity: overlay.position?.gravity || "north_east",
              x: overlay.position?.x || 20,
              y: overlay.position?.y || 20,
              opacity: overlay.opacity || 0.8,
              width: overlay.width || 80,
              height: overlay.height || 80,
            });
          }
        }
      }

      // If videoTitle is provided and no overlays, add a small, subtle text overlay
      if (
        options.videoTitle &&
        (!options.overlays || options.overlays.length === 0)
      ) {
        overlayTransformations.push({
          overlay: {
            font_family: "Arial",
            font_size: 32,
            text: options.videoTitle,
            font_weight: "normal",
            font_color: "#FFFFFF",
          },
          gravity: "south_east",
          x: 20,
          y: 20,
          opacity: 0.5,
          width: 400,
          height: 60,
        });
      }

      // Compose all transformations
      let finalUrl = CloudinaryService.getOptimizedUrl(publicId, {
        transformation: [transformation, ...overlayTransformations],
      });

      // Test if the final URL is accessible
      const isAccessible = await this.testImageAccessibility(finalUrl);
      if (!isAccessible) {
        finalUrl = this.getSimpleImageUrl(publicId);
      }
      return {
        id: `basic-${Date.now()}`,
        url: finalUrl,
        publicId,
        style: options.style || "basic",
        prompt: prompt,
      };
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Basic transformations error:",
        error
      );
      throw error;
    }
  }

  /**
   * Apply advanced overlays to an image using Cloudinary
   */
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

  /**
   * High-quality enhancement using DALL-E 3
   */
  private static async enhanceFrameWithDALLE3(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("No OpenAI API key provided for DALL-E 3");
      }

      console.log(
        "AI Thumbnail Service: Using DALL-E 3 for image generation..."
      );

      // Create enhanced prompt for DALL-E 3
      const enhancedPrompt = this.createEnhancedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log(
        "AI Thumbnail Service: Enhanced prompt for DALL-E 3:",
        enhancedPrompt
      );

      // Use DALL-E 3 text-to-image endpoint
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("AI Thumbnail Service: DALL-E 3 error:", errorText);
        throw new Error(`DALL-E 3 error: ${errorText}`);
      }

      console.log("AI Thumbnail Service: DALL-E 3 API call successful");

      const data = (await response.json()) as any;
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image data received from DALL-E 3");
      }

      console.log("AI Thumbnail Service: DALL-E 3 generation successful");

      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download DALL-E 3 generated image");
      }

      const generatedImageBuffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadBuffer(
        generatedImageBuffer,
        {
          folder: "ai-thumbnails",
          public_id: `dalle_${Date.now()}`, // Simplified naming
          resource_type: "image",
        }
      );

      const optimizedUrl = CloudinaryService.getOptimizedUrl(
        uploadResult.public_id,
        {
          transformation: {
            quality: "auto",
            format: "auto",
          },
        }
      );

      // Test if the optimized URL is accessible, fallback to simple URL if not
      const isAccessible = await this.testImageAccessibility(optimizedUrl);
      const finalImageUrl = isAccessible
        ? optimizedUrl
        : this.getSimpleImageUrl(uploadResult.public_id);

      return {
        id: `dalle3-${Date.now()}`,
        url: finalImageUrl,
        publicId: uploadResult.public_id,
        style: options.style || "dalle3",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: DALL-E 3 error:", error);
      throw error;
    }
  }

  /**
   * Hybrid approach: DALL-E 3 generation + original image combination
   */
  private static async enhanceFrameWithDALLE3Hybrid(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("No OpenAI API key provided for DALL-E 3");
      }

      console.log("AI Thumbnail Service: Using DALL-E 3 hybrid approach...");

      // First, upload the original image to Cloudinary
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Upload original image to Cloudinary
      const originalUploadResult = await CloudinaryService.uploadBuffer(
        imageBuffer,
        {
          folder: "ai-thumbnails",
          public_id: `orig_${Date.now()}`, // Simplified naming
          resource_type: "image",
        }
      );

      console.log(
        "AI Thumbnail Service: Original image uploaded to Cloudinary"
      );

      // Create enhanced prompt for DALL-E 3
      const enhancedPrompt = this.createEnhancedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log(
        "AI Thumbnail Service: Enhanced prompt for DALL-E 3:",
        enhancedPrompt
      );

      // Generate new image with DALL-E 3
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("AI Thumbnail Service: DALL-E 3 error:", errorText);
        throw new Error(`DALL-E 3 error: ${errorText}`);
      }

      console.log("AI Thumbnail Service: DALL-E 3 API call successful");

      const data = (await response.json()) as any;
      const dalleImageUrl = data.data?.[0]?.url;

      if (!dalleImageUrl) {
        throw new Error("No image data received from DALL-E 3");
      }

      console.log("AI Thumbnail Service: DALL-E 3 generation successful");

      // Download the DALL-E 3 generated image
      const dalleImageResponse = await fetch(dalleImageUrl);
      if (!dalleImageResponse.ok) {
        throw new Error("Failed to download DALL-E 3 generated image");
      }

      const dalleImageBuffer = Buffer.from(
        await dalleImageResponse.arrayBuffer()
      );

      // Upload DALL-E 3 image to Cloudinary
      const dalleUploadResult = await CloudinaryService.uploadBuffer(
        dalleImageBuffer,
        {
          folder: "ai-thumbnails",
          public_id: `dalle_${Date.now()}`, // Simplified naming
          resource_type: "image",
        }
      );

      console.log(
        "AI Thumbnail Service: DALL-E 3 image uploaded to Cloudinary"
      );

      // Create a combined image using Cloudinary overlays
      const combinedUrl = CloudinaryService.getOptimizedUrl(
        originalUploadResult.public_id,
        {
          transformation: {
            overlay: dalleUploadResult.public_id,
            opacity: 70,
            gravity: "center",
          },
        }
      );

      console.log("AI Thumbnail Service: Combined image created");

      // Test if the combined URL is accessible, fallback to simple URL if not
      const isAccessible = await this.testImageAccessibility(combinedUrl);
      const finalImageUrl = isAccessible
        ? combinedUrl
        : this.getSimpleImageUrl(originalUploadResult.public_id);

      return {
        id: `dalle3-hybrid-${Date.now()}`,
        url: finalImageUrl,
        publicId: originalUploadResult.public_id,
        style: options.style || "dalle3-hybrid",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: DALL-E 3 hybrid error:", error);

      // If DALL-E 3 fails, try Stability AI as fallback
      console.log(
        "AI Thumbnail Service: DALL-E 3 failed, trying Stability AI fallback..."
      );
      try {
        return await this.enhanceFrameWithStabilityAI(framePathOrUrl, prompt, {
          style: options.style,
          aspectRatio: options.aspectRatio,
          apiKey: options.apiKey,
          videoTitle: options.videoTitle,
          videoDescription: options.videoDescription,
        });
      } catch (stabilityError) {
        console.error(
          "AI Thumbnail Service: Stability AI fallback also failed:",
          stabilityError
        );
        throw new Error("All enhancement methods failed");
      }
    }
  }

  /**
   * High-quality thumbnail enhancement that preserves original image
   */
  private static async enhanceFrameWithPreservation(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      console.log(
        "AI Thumbnail Service: Using content preservation approach..."
      );

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Upload original image to Cloudinary
      const uploadResult = await CloudinaryService.uploadBuffer(imageBuffer, {
        folder: "ai-thumbnails",
        public_id: `preserved_${Date.now()}`,
        resource_type: "image",
      });

      // Apply minimal enhancements to preserve original content
      const enhancedUrl = CloudinaryService.getOptimizedUrl(
        uploadResult.public_id,
        {
          transformation: {
            brightness: 10,
            contrast: 15,
            saturation: 20,
            quality: "auto",
            format: "auto",
            effect: "sharpen:150",
          },
        }
      );

      // Add text overlay if video title exists
      if (options.videoTitle) {
        console.log(
          "AI Thumbnail Service: Adding preservation text overlay..."
        );

        const finalUrl = CloudinaryService.getOverlayedImageUrl(
          uploadResult.public_id,
          {
            text: options.videoTitle,
            fontFamily: "Impact",
            fontSize: 85,
            fontColor: "#FFFFFF",
            position: { gravity: "south", x: 0, y: 35 },
            background: "rgba(0,0,0,0.8)",
            opacity: 0.9,
            width: 1100,
            height: 150,
          }
        );

        return {
          id: `preservation-${Date.now()}`,
          url: finalUrl,
          publicId: uploadResult.public_id,
          style: options.style || "preservation",
          prompt: prompt,
        };
      }

      return {
        id: `preservation-${Date.now()}`,
        url: enhancedUrl,
        publicId: uploadResult.public_id,
        style: options.style || "preservation",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: Content preservation error:", error);
      throw error;
    }
  }

  /**
   * High-quality enhancement using Leonardo AI
   */
  private static async enhanceFrameWithLeonardoAI(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      const apiKey = options.apiKey || process.env.LEONARDO_API_KEY;
      if (!apiKey) {
        throw new Error("No Leonardo AI API key provided");
      }

      console.log(
        "AI Thumbnail Service: Using Leonardo AI for high-quality enhancement..."
      );

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Convert image to base64
      const imageBase64 = imageBuffer.toString("base64");

      // Create enhanced prompt
      const enhancedPrompt = this.createEnhancedPrompt(
        prompt,
        options.videoTitle,
        options.videoDescription
      );

      console.log(
        "AI Thumbnail Service: Enhanced prompt for Leonardo AI:",
        enhancedPrompt
      );

      // Use Leonardo AI image-to-image endpoint
      const response = await fetch(
        "https://cloud.leonardo.ai/api/rest/v1/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            modelId: "e316348f-7773-490e-adcd-46757c738eb7", // Leonardo Creative
            width: 1024,
            height: 1024,
            num_images: 1,
            init_strength: 0.35, // Preserve more of original
            init_image: imageBase64,
            guidance_scale: 7,
            num_inference_steps: 50,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("AI Thumbnail Service: Leonardo AI error:", errorText);
        throw new Error(`Leonardo AI error: ${errorText}`);
      }

      console.log("AI Thumbnail Service: Leonardo AI API call successful");

      const data = (await response.json()) as any;
      const generationId = data.sdGenerationJob?.generationId;

      if (!generationId) {
        throw new Error("No generation ID received from Leonardo AI");
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await fetch(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = (await statusResponse.json()) as any;
          const generations = statusData.generations_by_pk?.generated_images;

          if (generations && generations.length > 0) {
            const imageUrl = generations[0].url;

            console.log(
              "AI Thumbnail Service: Leonardo AI generation successful"
            );

            // Download the generated image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              throw new Error("Failed to download Leonardo AI generated image");
            }

            const generatedImageBuffer = Buffer.from(
              await imageResponse.arrayBuffer()
            );

            // Upload to Cloudinary
            const uploadResult = await CloudinaryService.uploadBuffer(
              generatedImageBuffer,
              {
                folder: "ai-thumbnails",
                public_id: `leonardo_enhanced_${Date.now()}`,
                resource_type: "image",
              }
            );

            return {
              id: `leonardo-${Date.now()}`,
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              style: options.style || "leonardo",
              prompt: prompt,
            };
          }
        }

        attempts++;
      }

      throw new Error("Leonardo AI generation timed out");
    } catch (error) {
      console.error("AI Thumbnail Service: Leonardo AI error:", error);
      throw error;
    }
  }

  /**
   * Precise enhancement: Only text overlay + subtle color improvements
   */
  private static async enhanceFrameWithPreciseControl(
    framePathOrUrl: string,
    prompt: string,
    options: {
      style?: string;
      aspectRatio?: string;
      apiKey?: string;
      videoTitle?: string;
      videoDescription?: string;
    } = {}
  ): Promise<GeneratedThumbnail> {
    try {
      console.log("AI Thumbnail Service: Using precise control approach...");

      // Download the base image
      let imageBuffer: Buffer;
      if (framePathOrUrl.startsWith("http")) {
        console.log("AI Thumbnail Service: Downloading base image from URL...");
        const response = await fetch(framePathOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        console.log("AI Thumbnail Service: Reading local image file...");
        imageBuffer = fs.readFileSync(framePathOrUrl);
      }

      // Upload original image to Cloudinary
      const uploadResult = await CloudinaryService.uploadBuffer(imageBuffer, {
        folder: "ai-thumbnails",
        public_id: `precise_enhanced_${Date.now()}`,
        resource_type: "image",
      });

      console.log(
        "AI Thumbnail Service: Original image uploaded to Cloudinary"
      );

      // Apply ONLY subtle color enhancements (no structural changes)
      const colorEnhancements = {
        brightness: 5, // Very subtle brightness increase
        contrast: 8, // Very subtle contrast increase
        saturation: 12, // Very subtle saturation increase
        quality: "auto",
        format: "auto",
      };

      // Create enhanced URL with ONLY color improvements
      const enhancedUrl = CloudinaryService.getOptimizedUrl(
        uploadResult.public_id,
        {
          transformation: colorEnhancements,
        }
      );

      console.log("AI Thumbnail Service: Subtle color enhancements applied");

      // Add professional text overlay ONLY if video title exists
      if (options.videoTitle) {
        console.log("AI Thumbnail Service: Adding text overlay only...");

        const overlayUrl = CloudinaryService.getOverlayedImageUrl(
          uploadResult.public_id,
          {
            text: options.videoTitle,
            fontFamily: "Impact",
            fontSize: 85,
            fontColor: "#FFFFFF",
            position: { gravity: "south", x: 0, y: 35 },
            background: "rgba(0,0,0,0.8)",
            opacity: 0.9,
            width: 1100,
            height: 150,
          }
        );

        console.log("AI Thumbnail Service: Text overlay added");

        return {
          id: `precise-${Date.now()}`,
          url: overlayUrl,
          publicId: uploadResult.public_id,
          style: options.style || "precise",
          prompt: prompt,
        };
      }

      // Return image with only color enhancements (no text overlay)
      return {
        id: `precise-${Date.now()}`,
        url: enhancedUrl,
        publicId: uploadResult.public_id,
        style: options.style || "precise",
        prompt: prompt,
      };
    } catch (error) {
      console.error("AI Thumbnail Service: Precise control error:", error);
      throw error;
    }
  }

  /**
   * Create focused prompt for Stability AI - text overlay and color enhancement only
   */
  private static createFocusedPrompt(
    userPrompt: string,
    videoTitle?: string,
    videoDescription?: string
  ): string {
    let focusedPrompt = userPrompt;

    // Add video context if available
    if (videoTitle) {
      focusedPrompt += ` Video title: "${videoTitle}".`;
    }
    if (videoDescription) {
      focusedPrompt += ` Video description: "${videoDescription}".`;
    }

    // Focus on preserving original content with minimal changes
    focusedPrompt += ` CRITICAL: Keep the original image EXACTLY as is. Do NOT change faces, objects, scene composition, lighting, shadows, or any structural elements. Do NOT add new objects or change existing ones. Only make these specific changes: 1) Add professional text overlay with bold typography at the bottom, 2) Enhance colors very subtly (brightness +5%, contrast +8%, saturation +10%), 3) Keep ALL original textures, details, structures, and composition intact. Preserve 97% of original content. Only add text overlay and very subtle color enhancement. Do NOT modify the original scene in any way.`;

    console.log("AI Thumbnail Service: Focused prompt created:", focusedPrompt);
    return focusedPrompt;
  }

  /**
   * Test if a Cloudinary image is accessible
   */
  private static async testImageAccessibility(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Image accessibility test failed:",
        error
      );
      return false;
    }
  }

  /**
   * Get a simple, reliable URL for an image
   */
  private static getSimpleImageUrl(publicId: string): string {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${publicId}`;
  }
}
