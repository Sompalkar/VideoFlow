import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class CloudinaryService {
  static async generateSignature(params: Record<string, any>): Promise<string> {
    try {
      const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!)
      return signature
    } catch (error) {
      console.error("Cloudinary signature generation error:", error)
      throw new Error("Failed to generate upload signature")
    }
  }

  static async uploadVideo(
    filePath: string,
    options: {
      folder?: string
      publicId?: string
      resourceType?: "video" | "image" | "auto"
    } = {},
  ): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: options.resourceType || "video",
        folder: options.folder || "videoflow",
        public_id: options.publicId,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      })

      return result
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      throw new Error("Failed to upload to Cloudinary")
    }
  }

  static async uploadImage(
    filePath: string,
    options: {
      folder?: string
      publicId?: string
    } = {},
  ): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "image",
        folder: options.folder || "videoflow",
        public_id: options.publicId,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      })

      return result
    } catch (error) {
      console.error("Cloudinary image upload error:", error)
      throw new Error("Failed to upload image to Cloudinary")
    }
  }

  static async deleteResource(publicId: string, resourceType: "image" | "video" = "image"): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })

      return result
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      throw new Error("Failed to delete resource from Cloudinary")
    }
  }

  static async getVideoInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "video",
      })

      return {
        publicId: result.public_id,
        url: result.secure_url,
        duration: result.duration,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
      }
    } catch (error) {
      console.error("Get video info error:", error)
      throw new Error("Failed to get video information")
    }
  }

  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      quality?: string
      format?: string
      resourceType?: "image" | "video"
    } = {},
  ): string {
    try {
      return cloudinary.url(publicId, {
        resource_type: options.resourceType || "image",
        width: options.width,
        height: options.height,
        quality: options.quality || "auto",
        format: options.format || "auto",
        fetch_format: "auto",
      })
    } catch (error) {
      console.error("Get optimized URL error:", error)
      throw new Error("Failed to generate optimized URL")
    }
  }
}
