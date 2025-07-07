import { CloudinaryService } from "./CloudinaryService";
import { VideoAnalysisService } from "./VideoAnalysisService";

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
  private static readonly STABILITY_API_KEY =
    "sk-Xq57r8dPzc7drhueorHsSGE3TpqnwCxaqdkZPjuHBxV0YGRG";
  private static readonly STABILITY_API_URL =
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

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

  private static async generateWithAI(
    prompt: string,
    options: { aspectRatio: string; style: string }
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
        return await this.generateWithStabilityAI(prompt, options);
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
    options: { aspectRatio: string; style: string }
  ): Promise<GeneratedThumbnail> {
    try {
      const openaiSize = this.getOpenAISize(options.aspectRatio);
      const cleanedPrompt = this.cleanPromptForDALLE(prompt);

      console.log(`AI Thumbnail Service: OpenAI request - Size: ${openaiSize}`);

      const response = await fetch(this.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
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
    prompt: string,
    options: { aspectRatio: string; style: string }
  ): Promise<GeneratedThumbnail> {
    try {
      const stabilitySize = this.getStabilityAISize(options.aspectRatio);

      // Validate dimensions before making API call
      if (
        !this.validateStabilityAIDimensions(
          stabilitySize.width,
          stabilitySize.height
        )
      ) {
        throw new Error(
          `Unsupported dimensions for Stability AI: ${stabilitySize.width}x${stabilitySize.height}`
        );
      }

      console.log(
        `AI Thumbnail Service: Stability AI request - Size: ${stabilitySize.width}x${stabilitySize.height}`
      );

      const requestBody = {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: stabilitySize.height,
        width: stabilitySize.width,
        samples: 1,
        steps: 30,
        style_preset: "cinematic",
        seed: 0,
        sampler: "K_DPMPP_2M",
      };

      console.log(
        "AI Thumbnail Service: Stability AI request body:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(this.STABILITY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.STABILITY_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "AI Thumbnail Service: Stability AI error response:",
          errorText
        );
        throw new Error(
          `Stability AI API error: ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as any;
      const artifact = data.artifacts?.[0];

      if (!artifact || !artifact.base64) {
        throw new Error("No image data received from Stability AI");
      }

      console.log("AI Thumbnail Service: Stability AI generation successful");

      // Convert base64 to buffer and upload to Cloudinary
      const imageBuffer = Buffer.from(artifact.base64, "base64");

      // Use uploadImageFromDataUrl instead of uploadBuffer for now
      const dataUrl = `data:image/png;base64,${artifact.base64}`;
      const uploadResult = await CloudinaryService.uploadImageFromDataUrl(
        dataUrl,
        {
          folder: "thumbnails",
          publicId: `stability-${Date.now()}`,
        }
      );

      return {
        id: `stability-${Date.now()}`,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        style: options.style,
        prompt: prompt,
      };
    } catch (error) {
      console.error(
        "AI Thumbnail Service: Stability AI generation failed:",
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
}
