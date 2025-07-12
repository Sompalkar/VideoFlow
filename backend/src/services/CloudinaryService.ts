import { v2 as cloudinary } from "cloudinary";

// Validate required environment variables
const validateCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME environment variable is required. Please set it in your .env file."
    );
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error(
      "CLOUDINARY_API_KEY environment variable is required. Please set it in your .env file."
    );
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "CLOUDINARY_API_SECRET environment variable is required. Please set it in your .env file."
    );
  }
};

// Initialize Cloudinary configuration
const initializeCloudinary = () => {
  validateCloudinaryConfig();
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
};

export class CloudinaryService {
  static async generateSignature(params: Record<string, any>): Promise<string> {
    try {
      validateCloudinaryConfig();

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET!
      );
      return signature;
    } catch (error) {
      console.error("Cloudinary signature generation error:", error);
      throw new Error("Failed to generate upload signature");
    }
  }

  static async uploadVideo(
    filePath: string,
    options: {
      folder?: string;
      publicId?: string;
      resourceType?: "video" | "image" | "auto";
    } = {}
  ): Promise<any> {
    try {
      // Initialize Cloudinary if not already done
      initializeCloudinary();

      // Check file size before upload
      const fs = require("fs");
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);

      // Cloudinary has a 100MB limit for free accounts, 10GB for paid
      if (fileSizeInMB > 100) {
        throw new Error(
          `File size (${fileSizeInMB.toFixed(
            2
          )} MB) exceeds Cloudinary's 100MB limit for free accounts. Please upgrade your Cloudinary plan or compress the video.`
        );
      }

      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: options.resourceType || "video",
        folder: options.folder || "videoflow",
        public_id: options.publicId,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        chunk_size: 6000000, // 6MB chunks for better upload handling
        eager: [
          { width: 1280, height: 720, crop: "scale" },
          { width: 854, height: 480, crop: "scale" },
        ],
        eager_async: true,
        eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
      });

      return result;
    } catch (error) {
      console.error("Cloudinary upload error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("413")) {
          throw new Error(
            "File too large for upload. Please compress your video or upgrade your Cloudinary plan."
          );
        } else if (error.message.includes("400")) {
          throw new Error(
            "Invalid file format or corrupted file. Please check your video file."
          );
        } else if (error.message.includes("401")) {
          throw new Error(
            "Cloudinary authentication failed. Please check your API credentials."
          );
        } else if (error.message.includes("429")) {
          throw new Error(
            "Upload rate limit exceeded. Please try again later."
          );
        }
      }

      throw new Error("Failed to upload to Cloudinary");
    }
  }

  static async uploadImage(
    filePath: string,
    options: {
      folder?: string;
      publicId?: string;
    } = {}
  ): Promise<any> {
    try {
      // Initialize Cloudinary if not already done
      initializeCloudinary();

      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "image",
        folder: options.folder || "videoflow",
        public_id: options.publicId,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      return result;
    } catch (error) {
      console.error("Cloudinary image upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  static async deleteResource(
    publicId: string,
    resourceType: "image" | "video" = "image"
  ): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete resource from Cloudinary");
    }
  }

  static async getVideoInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "video",
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        duration: result.duration,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error("Get video info error:", error);
      throw new Error("Failed to get video information");
    }
  }

  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      resourceType?: "image" | "video";
      transformation?: any;
    } = {}
  ): string {
    try {
      return cloudinary.url(publicId, {
        resource_type: options.resourceType || "image",
        width: options.width,
        height: options.height,
        quality: options.quality || "auto",
        format: options.format || "auto",
        fetch_format: "auto",
        transformation: options.transformation,
      });
    } catch (error) {
      console.error("Get optimized URL error:", error);
      throw new Error("Failed to generate optimized URL");
    }
  }

  // Get a direct, secure Cloudinary video URL for a given publicId
  static getVideoUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: "video",
      secure: true,
    });
  }

  static async uploadImageFromDataUrl(
    dataUrl: string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string;
        format?: string;
      };
    } = {}
  ): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(dataUrl, {
        resource_type: "image",
        folder: options.folder || "videoflow",
        public_id: options.publicId,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: options.transformation
          ? [options.transformation]
          : undefined,
      });

      return result;
    } catch (error) {
      console.error("Cloudinary data URL upload error:", error);
      throw new Error("Failed to upload data URL to Cloudinary");
    }
  }

  static async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      resource_type?: "image" | "video";
    } = {}
  ): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: options.resource_type || "image",
            folder: options.folder || "videoflow",
            public_id: options.public_id,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary buffer upload error:", error);
              reject(new Error("Failed to upload buffer to Cloudinary"));
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error("Cloudinary buffer upload error:", error);
      throw new Error("Failed to upload buffer to Cloudinary");
    }
  }

  static async transformImage(
    imageUrl: string,
    transformations: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      quality?: string;
      format?: string;
    } = {}
  ): Promise<string> {
    try {
      // Extract public ID from URL
      const urlParts = imageUrl.split("/");
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split(".")[0];

      // Build transformation parameters
      const transformParams: any = {};
      if (transformations.brightness)
        transformParams.brightness = transformations.brightness;
      if (transformations.contrast)
        transformParams.contrast = transformations.contrast;
      if (transformations.saturation)
        transformParams.saturation = transformations.saturation;
      if (transformations.quality)
        transformParams.quality = transformations.quality;
      if (transformations.format)
        transformParams.format = transformations.format;

      return cloudinary.url(publicId, {
        resource_type: "image",
        secure: true,
        transformation: [transformParams],
      });
    } catch (error) {
      console.error("Cloudinary image transformation error:", error);
      throw new Error("Failed to transform image");
    }
  }

  /**
   * Generate a Cloudinary URL with advanced text overlays
   */
  static getOverlayedImageUrl(
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
  ): string {
    const transformation: any[] = [];
    if (options.text) {
      transformation.push({
        overlay: {
          font_family: options.fontFamily || "Arial",
          font_size: options.fontSize || 60,
          text: options.text,
        },
        color: options.fontColor || "#FFFFFF",
        gravity: options.position?.gravity || "south",
        x: options.position?.x || 0,
        y: options.position?.y || 40,
        opacity: options.opacity || 90,
        background: options.background,
        width: options.width,
        height: options.height,
        crop: "fit",
      });
    }
    return cloudinary.url(publicId, {
      resource_type: "image",
      secure: true,
      transformation,
    });
  }
}
