import { CloudinaryService } from "./CloudinaryService";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

interface VideoFrame {
  timestamp: number;
  url: string;
  objects: string[];
  text: string[];
  colors: string[];
  scene: string;
}

interface VideoAnalysis {
  title: string;
  description: string;
  duration: number;
  frames: VideoFrame[];
  dominantObjects: string[];
  dominantColors: string[];
  detectedText: string[];
  scenes: string[];
  mood: string;
  category: string;
  contentType: string;
  targetAudience: string;
  videoStyle: string;
  keyTopics: string[];
  emotionalTone: string;
  visualElements: string[];
  brandElements: string[];
  trendingKeywords: string[];
  suggestedThumbnailElements: {
    objects: string[];
    colors: string[];
    text: string[];
    style: string;
    mood: string;
    composition: string;
    lighting: string;
    typography: string;
    visualEffects: string[];
    callToAction: string;
    backgroundStyle: string;
    iconography: string[];
  };
}

interface FrameAnalysis {
  objects: string[];
  colors: string[];
  text: string[];
  scenes: string[];
}

interface RichContext {
  objects: string[];
  text: string[];
  colors: string[];
  scene: string;
  mood: string;
  category: string;
  style: string;
  contentType: string;
  targetAudience: string;
  videoStyle: string;
  keyTopics: string[];
  emotionalTone: string;
  visualElements: string[];
  brandElements: string[];
  trendingKeywords: string[];
  composition: string;
  lighting: string;
  typography: string;
  visualEffects: string[];
  callToAction: string;
  backgroundStyle: string;
  iconography: string[];
}

export class VideoAnalysisService {
  private static readonly FRAME_INTERVAL = 5; // Extract frame every 5 seconds
  private static readonly MAX_FRAMES = 10; // Maximum frames to analyze

  static async analyzeVideo(
    videoUrl: string,
    title: string,
    description: string
  ): Promise<VideoAnalysis> {
    try {
      console.log(
        "Video Analysis Service: Starting enhanced analysis for:",
        title
      );

      // Try to perform full analysis with frame extraction
      try {
        const analysis = await this.performFullAnalysis(
          videoUrl,
          title,
          description
        );
        console.log(
          "Video Analysis Service: Full analysis with frame extraction completed"
        );
        return analysis;
      } catch (frameError: unknown) {
        const errorMessage =
          frameError instanceof Error ? frameError.message : "Unknown error";
        console.log(
          "Video Analysis Service: Frame extraction failed, falling back to simplified analysis:",
          errorMessage
        );
        // Fallback to simplified analysis
        const analysis = await this.performSimplifiedAnalysis(
          videoUrl,
          title,
          description
        );
        console.log("Video Analysis Service: Simplified analysis completed");
        return analysis;
      }
    } catch (error) {
      console.error("Video Analysis Service: Error analyzing video:", error);
      // Return a fallback analysis if the main analysis fails
      return this.getEnhancedFallbackAnalysis(title, description);
    }
  }

  private static async performFullAnalysis(
    videoUrl: string,
    title: string,
    description: string
  ): Promise<VideoAnalysis> {
    // Get video info
    const videoInfo = await this.getVideoInfo(videoUrl);

    // Check if ffmpeg is available
    const ffmpegAvailable = await this.checkFfmpegAvailability();

    let frames: VideoFrame[] = [];
    let frameAnalysis: FrameAnalysis = {
      objects: [],
      colors: [],
      text: [],
      scenes: [],
    };

    if (ffmpegAvailable) {
      try {
        // Extract frames using ffmpeg
        frames = await this.extractVideoFrames(videoUrl, videoInfo.duration);

        // Analyze frames for objects, colors, and scenes
        frameAnalysis = await this.analyzeFrames(frames);

        console.log(
          "Video Analysis Service: Frame extraction and analysis completed"
        );
      } catch (frameError: unknown) {
        const errorMessage =
          frameError instanceof Error ? frameError.message : "Unknown error";
        console.log(
          "Video Analysis Service: Frame extraction failed, continuing without frames:",
          errorMessage
        );
      }
    } else {
      console.log(
        "Video Analysis Service: FFmpeg not available, using enhanced text analysis only"
      );
    }

    // Extract rich context from title and description
    const context = this.extractRichContextFromText(title, description);

    // Combine frame analysis with text analysis
    const combinedObjects = [
      ...new Set([...context.objects, ...frameAnalysis.objects]),
    ];
    const combinedColors = [
      ...new Set([...context.colors, ...frameAnalysis.colors]),
    ];
    const combinedText = [...new Set([...context.text, ...frameAnalysis.text])];
    const combinedScenes = [
      ...new Set([context.scene, ...frameAnalysis.scenes]),
    ];

    const analysis: VideoAnalysis = {
      title,
      description,
      duration: videoInfo.duration || 60,
      frames,
      dominantObjects: combinedObjects,
      dominantColors: combinedColors,
      detectedText: combinedText,
      scenes: combinedScenes,
      mood: context.mood,
      category: context.category,
      contentType: context.contentType,
      targetAudience: context.targetAudience,
      videoStyle: context.videoStyle,
      keyTopics: context.keyTopics,
      emotionalTone: context.emotionalTone,
      visualElements: context.visualElements,
      brandElements: context.brandElements,
      trendingKeywords: context.trendingKeywords,
      suggestedThumbnailElements: {
        objects: combinedObjects,
        colors: combinedColors,
        text: combinedText,
        style: context.style,
        mood: context.mood,
        composition: context.composition,
        lighting: context.lighting,
        typography: context.typography,
        visualEffects: context.visualEffects,
        callToAction: context.callToAction,
        backgroundStyle: context.backgroundStyle,
        iconography: context.iconography,
      },
    };

    return analysis;
  }

  private static async checkFfmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn("ffmpeg", ["-version"]);

      ffmpeg.on("close", (code) => {
        resolve(code === 0);
      });

      ffmpeg.on("error", () => {
        resolve(false);
      });

      // Set a timeout
      setTimeout(() => {
        ffmpeg.kill();
        resolve(false);
      }, 5000); // 5 seconds timeout
    });
  }

  private static async extractVideoFrames(
    videoUrl: string,
    duration: number
  ): Promise<VideoFrame[]> {
    try {
      console.log("Video Analysis Service: Extracting frames using ffmpeg...");

      const frames: VideoFrame[] = [];
      const frameCount = Math.min(
        Math.floor(duration / this.FRAME_INTERVAL),
        this.MAX_FRAMES
      );

      // Create frames directory if it doesn't exist
      const framesDir = path.join(process.cwd(), "frames");
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }

      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * this.FRAME_INTERVAL;
        const framePath = path.join(framesDir, `frame_${i}_${Date.now()}.jpg`);

        try {
          await this.extractFrame(videoUrl, timestamp, framePath);

          // Analyze the extracted frame
          const frameAnalysis = await this.analyzeSingleFrame(framePath);

          frames.push({
            timestamp,
            url: framePath,
            objects: frameAnalysis.objects,
            text: frameAnalysis.text,
            colors: frameAnalysis.colors,
            scene: frameAnalysis.scene,
          });

          console.log(
            `Video Analysis Service: Extracted frame ${
              i + 1
            }/${frameCount} at ${timestamp}s`
          );
        } catch (frameError: unknown) {
          const errorMessage =
            frameError instanceof Error ? frameError.message : "Unknown error";
          console.log(
            `Video Analysis Service: Failed to extract frame ${i + 1}:`,
            errorMessage
          );
          // Continue with other frames
        }
      }

      return frames;
    } catch (error) {
      console.error("Video Analysis Service: Frame extraction failed:", error);
      throw new Error("Failed to extract video frames");
    }
  }

  private static async extractFrame(
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

      // Set a timeout
      setTimeout(() => {
        ffmpeg.kill();
        reject(new Error("FFmpeg timeout"));
      }, 30000); // 30 seconds timeout
    });
  }

  private static async analyzeSingleFrame(framePath: string): Promise<{
    objects: string[];
    text: string[];
    colors: string[];
    scene: string;
  }> {
    try {
      // For now, we'll do basic analysis based on the frame path
      // In a production system, you'd use computer vision APIs here
      const objects: string[] = ["person", "screen", "content"];
      const text: string[] = [];
      const colors: string[] = ["#3B82F6", "#EF4444", "#10B981"];
      const scene = "general";

      return { objects, text, colors, scene };
    } catch (error) {
      console.error("Video Analysis Service: Frame analysis failed:", error);
      return {
        objects: ["content"],
        text: [],
        colors: ["#3B82F6"],
        scene: "general",
      };
    }
  }

  private static async analyzeFrames(
    frames: VideoFrame[]
  ): Promise<FrameAnalysis> {
    const allObjects: string[] = [];
    const allColors: string[] = [];
    const allText: string[] = [];
    const allScenes: string[] = [];

    frames.forEach((frame) => {
      allObjects.push(...frame.objects);
      allColors.push(...frame.colors);
      allText.push(...frame.text);
      allScenes.push(frame.scene);
    });

    // Get unique values and most common ones
    const uniqueObjects = [...new Set(allObjects)];
    const uniqueColors = [...new Set(allColors)];
    const uniqueText = [...new Set(allText)];
    const uniqueScenes = [...new Set(allScenes)];

    return {
      objects: uniqueObjects.slice(0, 5), // Top 5 objects
      colors: uniqueColors.slice(0, 6), // Top 6 colors
      text: uniqueText.slice(0, 3), // Top 3 text elements
      scenes: uniqueScenes.slice(0, 3), // Top 3 scenes
    };
  }

  private static async getVideoInfo(
    videoUrl: string
  ): Promise<{ duration: number }> {
    try {
      // Try to get video info from Cloudinary if it's a Cloudinary URL
      if (videoUrl.includes("cloudinary.com")) {
        const publicId = this.extractPublicIdFromUrl(videoUrl);
        if (publicId) {
          const info = await CloudinaryService.getVideoInfo(publicId);
          return { duration: info.duration || 60 };
        }
      }
    } catch (error) {
      console.log("Could not get video info, using default duration");
    }

    return { duration: 60 }; // Default duration
  }

  private static extractPublicIdFromUrl(url: string): string | null {
    try {
      // Extract public ID from Cloudinary URL
      const match = url.match(/\/upload\/[^\/]+\/(.+?)(\.[^.]*)?$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private static extractRichContextFromText(
    title: string,
    description: string
  ): RichContext {
    const fullText = `${title} ${description}`.toLowerCase();

    // Enhanced object detection with more specific items
    const objects: string[] = [];
    if (/gaming|game|play|stream/i.test(fullText)) {
      objects.push(
        "gaming setup",
        "gaming controller",
        "gaming monitor",
        "RGB lighting",
        "gaming chair",
        "headset"
      );
    }
    if (/tutorial|how to|learn|guide|step by step/i.test(fullText)) {
      objects.push(
        "laptop",
        "computer screen",
        "whiteboard",
        "notebook",
        "pen",
        "diagram",
        "code editor"
      );
    }
    if (/review|test|compare|vs|versus/i.test(fullText)) {
      objects.push(
        "product box",
        "star rating",
        "comparison chart",
        "specifications",
        "price tag",
        "review badge"
      );
    }
    if (/news|update|breaking|latest/i.test(fullText)) {
      objects.push(
        "news ticker",
        "breaking news banner",
        "microphone",
        "news studio",
        "headlines"
      );
    }
    if (/music|song|audio|beat|melody/i.test(fullText)) {
      objects.push(
        "musical instruments",
        "headphones",
        "speakers",
        "music notes",
        "studio equipment",
        "vinyl record"
      );
    }
    if (/cooking|recipe|food|kitchen|chef/i.test(fullText)) {
      objects.push(
        "cooking ingredients",
        "kitchen utensils",
        "food presentation",
        "chef hat",
        "cooking pot",
        "fresh vegetables"
      );
    }
    if (/travel|vlog|trip|vacation|destination/i.test(fullText)) {
      objects.push(
        "camera",
        "passport",
        "suitcase",
        "landmark",
        "map",
        "travel guide",
        "airplane"
      );
    }
    if (/tech|technology|computer|software|app/i.test(fullText)) {
      objects.push(
        "smartphone",
        "laptop",
        "circuit board",
        "code",
        "app interface",
        "tech gadgets"
      );
    }
    if (/fitness|workout|exercise|gym|health/i.test(fullText)) {
      objects.push(
        "dumbbells",
        "gym equipment",
        "fitness tracker",
        "protein shake",
        "workout clothes",
        "gym floor"
      );
    }
    if (/business|work|office|corporate|entrepreneur/i.test(fullText)) {
      objects.push(
        "office desk",
        "business suit",
        "meeting room",
        "charts",
        "coffee cup",
        "briefcase"
      );
    }
    if (/comedy|funny|humor|joke|entertainment/i.test(fullText)) {
      objects.push(
        "microphone",
        "stage",
        "audience",
        "comedy club",
        "joke book",
        "laughing emoji"
      );
    }
    if (/beauty|makeup|skincare|fashion|style/i.test(fullText)) {
      objects.push(
        "makeup brushes",
        "cosmetics",
        "mirror",
        "fashion items",
        "beauty products",
        "styling tools"
      );
    }

    // Default objects if none detected
    if (objects.length === 0)
      objects.push("person", "screen", "content", "background");

    // Enhanced text extraction with better keyword analysis
    const text: string[] = [];
    const titleWords = title.split(" ").filter((word) => word.length > 2);
    const descriptionWords = description
      .split(" ")
      .filter((word) => word.length > 3);

    // Extract key phrases and important words
    text.push(...titleWords.slice(0, 4)); // First 4 meaningful words from title
    text.push(...descriptionWords.slice(0, 3)); // First 3 meaningful words from description

    // Enhanced color palette based on category and mood
    let colors: string[] = [];
    if (/gaming/i.test(fullText)) {
      colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
      ];
    } else if (/education|tutorial|learn/i.test(fullText)) {
      colors = [
        "#2E86AB",
        "#A23B72",
        "#F18F01",
        "#C73E1D",
        "#6A994E",
        "#A7C957",
      ];
    } else if (/review|test|compare/i.test(fullText)) {
      colors = [
        "#FFD700",
        "#FF6B35",
        "#004E89",
        "#FF8C00",
        "#FF1493",
        "#00CED1",
      ];
    } else if (/news|update|breaking/i.test(fullText)) {
      colors = [
        "#DC143C",
        "#000080",
        "#FFD700",
        "#FF4500",
        "#8B0000",
        "#0000CD",
      ];
    } else if (/music|song|audio/i.test(fullText)) {
      colors = [
        "#8B5CF6",
        "#EC4899",
        "#F59E0B",
        "#10B981",
        "#3B82F6",
        "#EF4444",
      ];
    } else if (/cooking|recipe|food/i.test(fullText)) {
      colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#FFE66D",
        "#FF8C42",
        "#FF6B9D",
        "#4ECDC4",
      ];
    } else if (/travel|vlog|trip/i.test(fullText)) {
      colors = [
        "#87CEEB",
        "#98FB98",
        "#F0E68C",
        "#FFB6C1",
        "#DDA0DD",
        "#F0F8FF",
      ];
    } else if (/tech|technology/i.test(fullText)) {
      colors = [
        "#00CED1",
        "#4169E1",
        "#32CD32",
        "#FF6347",
        "#9370DB",
        "#20B2AA",
      ];
    } else if (/fitness|workout/i.test(fullText)) {
      colors = [
        "#FF4500",
        "#32CD32",
        "#FFD700",
        "#FF69B4",
        "#00CED1",
        "#FF6347",
      ];
    } else if (/business|work/i.test(fullText)) {
      colors = [
        "#2F4F4F",
        "#696969",
        "#708090",
        "#B0C4DE",
        "#F5F5DC",
        "#F0F8FF",
      ];
    } else {
      colors = [
        "#3B82F6",
        "#EF4444",
        "#10B981",
        "#F59E0B",
        "#8B5CF6",
        "#EC4899",
      ];
    }

    // Enhanced scene detection
    let scene = "general";
    if (/gaming|game/i.test(fullText)) scene = "gaming setup with RGB lighting";
    else if (/office|work|business/i.test(fullText))
      scene = "modern office environment";
    else if (/kitchen|cooking|food/i.test(fullText))
      scene = "professional kitchen";
    else if (/outdoor|travel|nature/i.test(fullText))
      scene = "outdoor landscape";
    else if (/studio|recording|music/i.test(fullText))
      scene = "recording studio";
    else if (/gym|fitness|workout/i.test(fullText)) scene = "modern gym";
    else if (/classroom|education|school/i.test(fullText))
      scene = "educational environment";

    // Enhanced mood detection
    let mood = "professional";
    if (/funny|comedy|humor|joke|entertainment/i.test(fullText))
      mood = "humorous and entertaining";
    else if (/serious|deep|analysis|critical/i.test(fullText))
      mood = "serious and analytical";
    else if (/energetic|exciting|amazing|incredible|epic/i.test(fullText))
      mood = "energetic and exciting";
    else if (/calm|relaxing|peaceful|soothing/i.test(fullText))
      mood = "calm and relaxing";
    else if (/dramatic|intense|thrilling/i.test(fullText))
      mood = "dramatic and intense";
    else if (/inspiring|motivational|uplifting/i.test(fullText))
      mood = "inspiring and motivational";

    // Enhanced category detection
    let category = "general";
    if (/gaming|game|play|stream/i.test(fullText)) category = "gaming";
    else if (/tutorial|how to|learn|guide|education/i.test(fullText))
      category = "education";
    else if (/review|test|compare|vs|versus/i.test(fullText))
      category = "review";
    else if (/news|update|breaking|latest/i.test(fullText)) category = "news";
    else if (/music|song|audio|beat/i.test(fullText)) category = "music";
    else if (/cooking|recipe|food|kitchen/i.test(fullText))
      category = "cooking";
    else if (/travel|vlog|trip|vacation/i.test(fullText)) category = "travel";
    else if (/tech|technology|software|app/i.test(fullText))
      category = "technology";
    else if (/fitness|workout|exercise|gym/i.test(fullText))
      category = "fitness";
    else if (/business|work|office|corporate/i.test(fullText))
      category = "business";
    else if (/comedy|funny|humor|entertainment/i.test(fullText))
      category = "comedy";
    else if (/beauty|makeup|skincare|fashion/i.test(fullText))
      category = "beauty";

    // Enhanced style detection
    let style = "modern";
    if (/vintage|retro|classic/i.test(fullText)) style = "vintage";
    else if (/minimal|clean|simple/i.test(fullText)) style = "minimal";
    else if (/bold|dramatic|intense/i.test(fullText)) style = "bold";
    else if (/professional|corporate|business/i.test(fullText))
      style = "professional";
    else if (/creative|artistic|design/i.test(fullText)) style = "creative";

    // Enhanced content type detection
    let contentType = "general";
    if (/tutorial|how to|guide/i.test(fullText)) contentType = "tutorial";
    else if (/review|test|compare/i.test(fullText)) contentType = "review";
    else if (/vlog|daily|life/i.test(fullText)) contentType = "vlog";
    else if (/interview|conversation|talk/i.test(fullText))
      contentType = "interview";
    else if (/unboxing|opening/i.test(fullText)) contentType = "unboxing";
    else if (/challenge|experiment/i.test(fullText)) contentType = "challenge";
    else if (/reaction|react/i.test(fullText)) contentType = "reaction";

    // Target audience detection
    let targetAudience = "general";
    if (/beginner|newbie|start/i.test(fullText)) targetAudience = "beginners";
    else if (/advanced|expert|pro/i.test(fullText))
      targetAudience = "advanced users";
    else if (/kids|children|family/i.test(fullText)) targetAudience = "family";
    else if (/teen|young|youth/i.test(fullText)) targetAudience = "teens";
    else if (/adult|mature/i.test(fullText)) targetAudience = "adults";

    // Video style detection
    let videoStyle = "standard";
    if (/cinematic|movie|film/i.test(fullText)) videoStyle = "cinematic";
    else if (/documentary|educational/i.test(fullText))
      videoStyle = "documentary";
    else if (/vlog|personal/i.test(fullText)) videoStyle = "vlog";
    else if (/commercial|promotional/i.test(fullText))
      videoStyle = "commercial";

    // Key topics extraction
    const keyTopics: string[] = [];
    const topicKeywords = {
      gaming: ["gaming", "game", "play", "stream", "esports", "gamer"],
      tech: ["technology", "tech", "software", "app", "computer", "digital"],
      education: [
        "learn",
        "tutorial",
        "education",
        "course",
        "skill",
        "knowledge",
      ],
      entertainment: ["fun", "entertainment", "comedy", "humor", "funny"],
      business: ["business", "work", "career", "professional", "entrepreneur"],
      lifestyle: ["life", "daily", "routine", "lifestyle", "personal"],
      health: ["health", "fitness", "wellness", "nutrition", "exercise"],
      travel: ["travel", "trip", "vacation", "destination", "adventure"],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => fullText.includes(keyword))) {
        keyTopics.push(topic);
      }
    }

    // Emotional tone detection
    let emotionalTone = "neutral";
    if (/excited|amazing|incredible|awesome/i.test(fullText))
      emotionalTone = "excited";
    else if (/calm|peaceful|relaxing/i.test(fullText)) emotionalTone = "calm";
    else if (/dramatic|intense|thrilling/i.test(fullText))
      emotionalTone = "dramatic";
    else if (/funny|humorous|entertaining/i.test(fullText))
      emotionalTone = "humorous";
    else if (/serious|important|critical/i.test(fullText))
      emotionalTone = "serious";

    // Visual elements detection
    const visualElements: string[] = [];
    if (/animation|animated/i.test(fullText)) visualElements.push("animation");
    if (/graphics|visual/i.test(fullText)) visualElements.push("graphics");
    if (/text|typography/i.test(fullText)) visualElements.push("text overlay");
    if (/logo|brand/i.test(fullText)) visualElements.push("branding");
    if (/chart|graph|data/i.test(fullText))
      visualElements.push("data visualization");

    // Brand elements detection
    const brandElements: string[] = [];
    if (/nike|adidas|puma/i.test(fullText)) brandElements.push("sports brand");
    if (/apple|iphone|mac/i.test(fullText)) brandElements.push("Apple");
    if (/samsung|android/i.test(fullText)) brandElements.push("Samsung");
    if (/sony|playstation/i.test(fullText)) brandElements.push("Sony");
    if (/microsoft|xbox/i.test(fullText)) brandElements.push("Microsoft");

    // Trending keywords detection
    const trendingKeywords: string[] = [];
    const currentTrends = [
      "2024",
      "latest",
      "new",
      "trending",
      "viral",
      "popular",
      "best",
      "top",
    ];
    trendingKeywords.push(
      ...currentTrends.filter((keyword) => fullText.includes(keyword))
    );

    // Enhanced composition suggestions
    let composition = "balanced";
    if (/dramatic|intense/i.test(fullText)) composition = "dramatic";
    else if (/minimal|clean/i.test(fullText)) composition = "minimal";
    else if (/dynamic|energetic/i.test(fullText)) composition = "dynamic";

    // Lighting suggestions
    let lighting = "natural";
    if (/dramatic|intense/i.test(fullText)) lighting = "dramatic";
    else if (/soft|warm/i.test(fullText)) lighting = "soft";
    else if (/bright|vibrant/i.test(fullText)) lighting = "bright";

    // Typography suggestions
    let typography = "modern";
    if (/vintage|retro/i.test(fullText)) typography = "vintage";
    else if (/bold|strong/i.test(fullText)) typography = "bold";
    else if (/elegant|sophisticated/i.test(fullText)) typography = "elegant";

    // Visual effects suggestions
    const visualEffects: string[] = [];
    if (/glow|neon/i.test(fullText)) visualEffects.push("glow effect");
    if (/shadow|depth/i.test(fullText)) visualEffects.push("shadow effects");
    if (/gradient|colorful/i.test(fullText)) visualEffects.push("gradient");
    if (/texture|pattern/i.test(fullText)) visualEffects.push("texture");

    // Call to action suggestions
    let callToAction = "watch now";
    if (/learn|tutorial/i.test(fullText)) callToAction = "learn now";
    else if (/buy|purchase/i.test(fullText)) callToAction = "buy now";
    else if (/download|get/i.test(fullText)) callToAction = "download now";
    else if (/subscribe|join/i.test(fullText)) callToAction = "subscribe";

    // Background style suggestions
    let backgroundStyle = "clean";
    if (/busy|detailed/i.test(fullText)) backgroundStyle = "detailed";
    else if (/blur|bokeh/i.test(fullText)) backgroundStyle = "blurred";
    else if (/pattern|texture/i.test(fullText)) backgroundStyle = "textured";

    // Iconography suggestions
    const iconography: string[] = [];
    if (/gaming/i.test(fullText))
      iconography.push("gaming icons", "controller icon", "trophy icon");
    if (/tech/i.test(fullText))
      iconography.push("tech icons", "code icon", "device icons");
    if (/education/i.test(fullText))
      iconography.push("education icons", "book icon", "graduation icon");
    if (/music/i.test(fullText))
      iconography.push("music icons", "note icon", "headphone icon");

    return {
      objects,
      text,
      colors,
      scene,
      mood,
      category,
      style,
      contentType,
      targetAudience,
      videoStyle,
      keyTopics,
      emotionalTone,
      visualElements,
      brandElements,
      trendingKeywords,
      composition,
      lighting,
      typography,
      visualEffects,
      callToAction,
      backgroundStyle,
      iconography,
    };
  }

  private static getEnhancedFallbackAnalysis(
    title: string,
    description: string
  ): VideoAnalysis {
    const context = this.extractRichContextFromText(title, description);

    return {
      title,
      description,
      duration: 60,
      frames: [
        {
          timestamp: 0,
          url: "",
          objects: context.objects,
          text: context.text,
          colors: context.colors,
          scene: context.scene,
        },
      ],
      dominantObjects: context.objects,
      dominantColors: context.colors,
      detectedText: context.text,
      scenes: [context.scene],
      mood: context.mood,
      category: context.category,
      contentType: context.contentType,
      targetAudience: context.targetAudience,
      videoStyle: context.videoStyle,
      keyTopics: context.keyTopics,
      emotionalTone: context.emotionalTone,
      visualElements: context.visualElements,
      brandElements: context.brandElements,
      trendingKeywords: context.trendingKeywords,
      suggestedThumbnailElements: {
        objects: context.objects,
        colors: context.colors,
        text: context.text,
        style: context.style,
        mood: context.mood,
        composition: context.composition,
        lighting: context.lighting,
        typography: context.typography,
        visualEffects: context.visualEffects,
        callToAction: context.callToAction,
        backgroundStyle: context.backgroundStyle,
        iconography: context.iconography,
      },
    };
  }

  private static async performSimplifiedAnalysis(
    videoUrl: string,
    title: string,
    description: string
  ): Promise<VideoAnalysis> {
    // Analyze the video URL and metadata
    const videoInfo = await this.getVideoInfo(videoUrl);

    // Extract context from title and description
    const context = this.extractRichContextFromText(title, description);

    // Generate mock frames for consistency
    const frames: VideoFrame[] = [
      {
        timestamp: 0,
        url: videoUrl,
        objects: context.objects,
        text: context.text,
        colors: context.colors,
        scene: context.scene,
      },
    ];

    const analysis: VideoAnalysis = {
      title,
      description,
      duration: videoInfo.duration || 60, // Default 60 seconds
      frames,
      dominantObjects: context.objects,
      dominantColors: context.colors,
      detectedText: context.text,
      scenes: [context.scene],
      mood: context.mood,
      category: context.category,
      contentType: context.contentType,
      targetAudience: context.targetAudience,
      videoStyle: context.videoStyle,
      keyTopics: context.keyTopics,
      emotionalTone: context.emotionalTone,
      visualElements: context.visualElements,
      brandElements: context.brandElements,
      trendingKeywords: context.trendingKeywords,
      suggestedThumbnailElements: {
        objects: context.objects,
        colors: context.colors,
        text: context.text,
        style: context.style,
        mood: context.mood,
        composition: context.composition,
        lighting: context.lighting,
        typography: context.typography,
        visualEffects: context.visualEffects,
        callToAction: context.callToAction,
        backgroundStyle: context.backgroundStyle,
        iconography: context.iconography,
      },
    };

    return analysis;
  }
}
