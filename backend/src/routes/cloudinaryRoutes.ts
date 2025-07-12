import { Router } from "express";
import type { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { CloudinaryService } from "../services/CloudinaryService";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 100MB limit to match Cloudinary free tier
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = {
      video: [
        ".mp4",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".webm",
        ".mkv",
        ".m4v",
        ".3gp",
        ".ogv",
      ],
      image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
    };

    const ext = path.extname(file.originalname).toLowerCase();
    // Determine resourceType by extension
    let resourceType: "video" | "image" | undefined;
    if (allowedTypes.video.includes(ext)) {
      resourceType = "video";
    } else if (allowedTypes.image.includes(ext)) {
      resourceType = "image";
    }

    // Set resourceType on req for use in route handler
    (req as any).resourceType = resourceType;

    // Log the file upload attempt for debugging
    console.log(
      `File upload attempt: ${file.originalname}, Extension: ${ext}, Determined Resource Type: ${resourceType}`
    );

    if (resourceType) {
      cb(null, true);
    } else {
      // Provide a user-friendly error message
      const errorMsg =
        "Invalid file type. Please upload a supported video (e.g., .mp4, .avi) or image (e.g., .jpg, .png) format.";
      console.error("File filter error:", errorMsg);
      cb(new Error(errorMsg));
    }
  },
});

// @route   POST /api/cloudinary/upload
// @desc    Upload file to Cloudinary
// @access  Private
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      console.log("Upload request received:", {
        file: req.file ? req.file.originalname : "No file",
        body: req.body,
      });

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      // Use resourceType determined by fileFilter
      const resourceType = (req as any).resourceType;
      if (!resourceType) {
        res.status(400).json({ message: "Invalid or unsupported file type." });
        return;
      }

      const filePath = req.file.path;
      console.log(
        `Processing ${resourceType} upload: ${req.file.originalname}`
      );

      // Check file size before attempting upload
      const fileSizeInMB = req.file.size / (1024 * 1024);
      console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);

      if (fileSizeInMB > 100) {
        // Clean up temporary file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(413).json({
          message: `File size (${fileSizeInMB.toFixed(
            2
          )} MB) exceeds the 100MB limit. Please compress your video or upgrade your Cloudinary plan.`,
        });
        return;
      }

      let result;
      if (resourceType === "video") {
        result = await CloudinaryService.uploadVideo(filePath, {
          folder: "videoflow/videos",
          resourceType: "video",
        });
      } else if (resourceType === "image") {
        result = await CloudinaryService.uploadImage(filePath, {
          folder: "videoflow/images",
        });
      } else {
        res.status(400).json({ message: "Unsupported resource type." });
        return;
      }

      // Clean up temporary file
      fs.unlinkSync(filePath);

      console.log("Upload successful:", result.public_id);

      res.json({
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          duration: result.duration, // Only for videos
        },
      });
    } catch (error) {
      // Clean up temporary file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Cloudinary upload error:", error);

      // Provide more specific error responses
      if (error instanceof Error) {
        if (
          error.message.includes("413") ||
          error.message.includes("too large")
        ) {
          res.status(413).json({
            message:
              error.message ||
              "File too large for upload. Please compress your video or upgrade your Cloudinary plan.",
          });
        } else if (error.message.includes("401")) {
          res.status(401).json({
            message:
              "Cloudinary authentication failed. Please check your API credentials.",
          });
        } else if (error.message.includes("429")) {
          res.status(429).json({
            message: "Upload rate limit exceeded. Please try again later.",
          });
        } else {
          res.status(500).json({
            message: error.message || "Upload failed",
          });
        }
      } else {
        res.status(500).json({
          message: "Upload failed",
        });
      }
    }
  }
);

// @route   POST /api/cloudinary/signature
// @desc    Generate upload signature for client-side uploads
// @access  Private
router.post(
  "/signature",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { resourceType = "video" } = req.body;
      const timestamp = Math.round(new Date().getTime() / 1000);

      const params = {
        timestamp,
        folder: `videoflow/${resourceType}s`,
        resource_type: resourceType,
        chunk_size: 6000000,
      };

      const signature = await CloudinaryService.generateSignature(params);

      res.json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: params.folder,
      });
    } catch (error) {
      console.error("Signature generation error:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate signature",
      });
    }
  }
);

// @route   DELETE /api/cloudinary/:publicId
// @desc    Delete file from Cloudinary
// @access  Private
router.delete(
  "/:publicId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { publicId } = req.params;
      const { resourceType = "image" } = req.query;

      const result = await CloudinaryService.deleteResource(
        publicId,
        resourceType as "image" | "video"
      );

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete file",
      });
    }
  }
);

// @route   GET /api/cloudinary/:publicId/info
// @desc    Get file info from Cloudinary
// @access  Private
router.get(
  "/:publicId/info",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { publicId } = req.params;
      const info = await CloudinaryService.getVideoInfo(publicId);

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error("Get file info error:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to get file info",
      });
    }
  }
);

export default router;
