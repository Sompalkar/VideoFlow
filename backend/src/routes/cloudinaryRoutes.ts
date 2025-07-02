import { Router } from "express";
import type { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth";
import { CloudinaryService } from "../services/CloudinaryService";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
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
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      video: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"],
      image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    };

    const ext = path.extname(file.originalname).toLowerCase();
    const resourceType = req.body.resourceType || "video";

    if (resourceType === "video" && allowedTypes.video.includes(ext)) {
      cb(null, true);
    } else if (resourceType === "image" && allowedTypes.image.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types for ${resourceType}: ${allowedTypes[
            resourceType as keyof typeof allowedTypes
          ].join(", ")}`
        )
      );
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
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const { resourceType = "video" } = req.body;
      const filePath = req.file.path;

      let result;
      if (resourceType === "video") {
        result = await CloudinaryService.uploadVideo(filePath, {
          folder: "videoflow/videos",
          resourceType: "video",
        });
      } else {
        result = await CloudinaryService.uploadImage(filePath, {
          folder: "videoflow/images",
        });
      }

      // Clean up temporary file
      fs.unlinkSync(filePath);

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
      res.status(500).json({
        message: error instanceof Error ? error.message : "Upload failed",
      });
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
