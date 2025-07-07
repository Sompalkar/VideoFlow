import { Request, Response } from "express";
import { FrameBasedThumbnailService } from "../services/FrameBasedThumbnailService";

export const generateFrameBasedThumbnails = async (
  req: Request,
  res: Response
) => {
  try {
    const { videoUrl, title, description } = req.body;

    if (!videoUrl || !title) {
      return res.status(400).json({
        success: false,
        message: "Video URL and title are required",
      });
    }

    console.log(
      "Frame Thumbnail Controller: Generating frame-based thumbnails"
    );
    console.log("Frame Thumbnail Controller: Video title:", title);

    // Generate frame-based thumbnails
    const thumbnails =
      await FrameBasedThumbnailService.generateFrameBasedThumbnails(
        videoUrl,
        title,
        description || ""
      );

    console.log(
      "Frame Thumbnail Controller: Generated",
      thumbnails.length,
      "frame-based thumbnails"
    );

    // Clean up extracted frames
    await FrameBasedThumbnailService.cleanupFrames();

    return res.json({
      success: true,
      message: "Frame-based thumbnails generated successfully",
      thumbnails: thumbnails.map((thumb) => ({
        url: thumb.url,
        publicId: thumb.publicId,
        style: thumb.style,
        frameInfo: {
          timestamp: thumb.frame.timestamp,
          objects: thumb.frame.objects,
          colors: thumb.frame.colors,
          quality: thumb.frame.quality,
        },
      })),
    });
  } catch (error) {
    console.error(
      "Frame Thumbnail Controller: Error generating thumbnails:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to generate frame-based thumbnails",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
