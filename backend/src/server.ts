import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";

// import { connectDB } from "@/config/database"
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Import routes
import authRoutes from "./routes/authRoutes";
import videoRoutes from "./routes/videoRoutes";
import teamRoutes from "./routes/teamRoutes";
import userRoutes from "./routes/userRoutes";
import youtubeRoutes from "./routes/youtubeRoutes";
import cloudinaryRoutes from "./routes/cloudinaryRoutes";
import aiThumbnailRoutes from "./routes/aiThumbnailRoutes";
import youtubeThumbnailRoutes from "./routes/youtubeThumbnailRoutes";

// import commentRoutes from "routes/commentRoutes";
import commentRouter from "./routes/commentRoutes";
import { socketService } from "./services/socket-service";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Trust proxy - important for rate limiting behind reverse proxies
// Trust only the first proxy (Render, Vercel, etc.) for security
app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
socketService.initialize(server);

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 requests in development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://flow-inky-gamma.vercel.app",
      "https://flow-inky-gamma.vercel.app/",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());
app.use("/api/", limiter);

// Create uploads directory
import fs from "fs";
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/user", userRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/ai-thumbnails", aiThumbnailRoutes);
app.use("/api/youtube-thumbnails", youtubeThumbnailRoutes);
app.use("/api/comments", commentRouter);
// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(`🔌 Socket.IO initialized`);
});

export default app;
