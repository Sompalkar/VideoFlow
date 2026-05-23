import { Request, Response } from "express";
import { YouTubeStyleThumbnailService } from "../services/YouTubeStyleThumbnailService";

export const generateYouTubeStyleThumbnails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      baseImage,
      videoUrl,
      title,
      subtitle,
      style = "cool-energy",
      aspectRatio = "16:9",
      quality = "medium",
      variations = 4,
      platform = "youtube",
      customColors,
      effects,
    } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    if (!baseImage && !videoUrl) {
      res.status(400).json({
        success: false,
        message: "Either baseImage or videoUrl must be provided",
      });
      return;
    }

    console.log("YouTube Thumbnail Controller: Generating thumbnails...");
    console.log("YouTube Thumbnail Controller: Title:", title);
    console.log("YouTube Thumbnail Controller: Style:", style);

    const options = {
      baseImage,
      videoUrl,
      title,
      subtitle,
      style,
      aspectRatio,
      quality,
      variations,
      platform,
      customColors,
      effects,
    };

    const thumbnails = await YouTubeStyleThumbnailService.generateThumbnails(
      options
    );

    console.log(
      "YouTube Thumbnail Controller: Generated",
      thumbnails.length,
      "thumbnails"
    );

    res.json({
      success: true,
      message: "YouTube-style thumbnails generated successfully",
      thumbnails,
      metadata: {
        style,
        aspectRatio,
        quality,
        platform,
        variations: thumbnails.length,
      },
    });
  } catch (error) {
    console.error("YouTube Thumbnail Controller: Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate YouTube-style thumbnails",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAvailableStyles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const styles = YouTubeStyleThumbnailService.getAvailableStyles();

    res.json({
      success: true,
      styles,
      count: styles.length,
    });
  } catch (error) {
    console.error("YouTube Thumbnail Controller: Error getting styles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get available styles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getStyleDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { styleName } = req.params;
    const style = YouTubeStyleThumbnailService.getStyle(styleName);

    if (!style) {
      res.status(404).json({
        success: false,
        message: "Style not found",
      });
      return;
    }

    res.json({
      success: true,
      style,
    });
  } catch (error) {
    console.error(
      "YouTube Thumbnail Controller: Error getting style details:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get style details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
