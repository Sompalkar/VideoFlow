"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainNav } from "@/components/main-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Upload,
  Video,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  Eye,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useCloudinaryStore } from "@/lib/stores/cloudinary-store";

interface VideoFile {
  file: File;
  preview: string;
  duration?: number;
}

interface ThumbnailFile {
  file: File;
  preview: string;
}

const UPLOAD_STEPS = [
  { id: 1, title: "Select Video", description: "Choose your video file" },
  { id: 2, title: "Preview", description: "Review your content" },
  { id: 3, title: "Details", description: "Add title and description" },
  { id: 4, title: "Upload", description: "Upload to platform" },
  { id: 5, title: "Complete", description: "Upload successful" },
];

// Helper to determine resourceType based on file extension
function getResourceType(file: File): "video" | "image" {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const videoExts = [
    "mp4",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "mkv",
    "m4v",
    "3gp",
    "ogv",
  ];
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  // Default fallback - check MIME type
  return file.type.startsWith("image/") ? "image" : "video";
}

export default function UploadPage() {
  const { user } = useAuthStore();
  const { uploadVideo, isLoading } = useVideoStore();
  const { uploadToCloudinary, uploadProgress } = useCloudinaryStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<ThumbnailFile | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [videoDetails, setVideoDetails] = useState({
    title: "",
    description: "",
    tags: "",
    category: "entertainment",
    privacy: "public",
    scheduledDate: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) => file.type.startsWith("video/"));
    if (videoFile) {
      handleVideoSelect(videoFile);
    }
  }, []);

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      // 500MB limit
      setError("File size must be less than 500MB");
      return;
    }

    const preview = URL.createObjectURL(file);
    setVideoFile({ file, preview });
    setVideoDetails((prev) => ({
      ...prev,
      title: file.name.replace(/\.[^/.]+$/, ""),
    }));
    setError("");
    setCurrentStep(2);
  };

  const handleThumbnailSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const preview = URL.createObjectURL(file);
    setThumbnailFile({ file, preview });
  };

  const generateThumbnail = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
        const preview = URL.createObjectURL(blob);
        setThumbnailFile({ file, preview });
      }
    }, "image/jpeg");
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;

    try {
      setError("");
      setCurrentStep(4);

      // Upload video to Cloudinary
      const videoResourceType = getResourceType(videoFile.file);
      console.log("Uploading video with resource type:", videoResourceType);

      const videoResult = await uploadToCloudinary(
        videoFile.file,
        videoResourceType
      );

      console.log("Video upload result:", videoResult);

      let thumbnailResult: any = null;

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbResourceType = getResourceType(thumbnailFile.file);
        console.log(
          "Uploading thumbnail with resource type:",
          thumbResourceType
        );

        thumbnailResult = await uploadToCloudinary(
          thumbnailFile.file,
          thumbResourceType
        );

        console.log("Thumbnail upload result:", thumbnailResult);
      }

      // Prepare video upload payload for backend
      const uploadPayload = {
        title: videoDetails.title,
        description: videoDetails.description,
        tags: videoDetails.tags.split(",").map((tag) => tag.trim()),
        category: videoDetails.category,
        privacy: videoDetails.privacy,
        cloudinaryVideoId:
          videoResult?.data?.publicId ||
          videoResult?.data?.public_id ||
          videoResult?.publicId ||
          videoResult?.public_id ||
          "",
        cloudinaryVideoUrl:
          videoResult?.data?.url ||
          videoResult?.data?.secure_url ||
          videoResult?.url ||
          videoResult?.secure_url ||
          "",
        cloudinaryThumbnailId:
          thumbnailResult?.data?.publicId ||
          thumbnailResult?.data?.public_id ||
          thumbnailResult?.publicId ||
          thumbnailResult?.public_id ||
          undefined,
        cloudinaryThumbnailUrl:
          thumbnailResult?.data?.url ||
          thumbnailResult?.data?.secure_url ||
          thumbnailResult?.url ||
          thumbnailResult?.secure_url ||
          "",
        fileSize:
          videoResult?.data?.bytes || videoResult?.bytes || videoFile.file.size,
        duration: videoResult?.data?.duration || videoResult?.duration || 0,
      };

      console.log("Upload payload to backend:", uploadPayload);

      await uploadVideo(uploadPayload);

      setUploadSuccess(true);
      setCurrentStep(5);
    } catch (error) {
      console.error("Upload error:", error);
      // Show user-friendly error for file type issues
      if (
        error instanceof Error &&
        error.message &&
        error.message.toLowerCase().includes("invalid file type")
      ) {
        setError(
          "The file you selected is not a valid video or image. Please check the file type and try again."
        );
      } else {
        setError(error instanceof Error ? error.message : "Upload failed");
      }
      setCurrentStep(3);
    }
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoDetails({
      title: "",
      description: "",
      tags: "",
      category: "entertainment",
      privacy: "public",
      scheduledDate: "",
    });
    setError("");
    setUploadSuccess(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Please log in to upload videos
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <MainNav />
      <DashboardNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
          </div>
          <p className="text-gray-600">Share your content with the world</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {UPLOAD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < UPLOAD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
          <CardContent className="p-8">
            {/* Step 1: File Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Select Your Video
                  </h2>
                  <p className="text-gray-600">
                    Choose a video file to upload (Max 500MB)
                  </p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drag and drop your video here
                  </h3>
                  <p className="text-gray-600 mb-4">or click to browse files</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoSelect(file);
                    }}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>MP4, MOV, AVI supported</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Max file size: 500MB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>HD quality recommended</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preview */}
            {currentStep === 2 && videoFile && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Preview Your Video
                  </h2>
                  <p className="text-gray-600">
                    Review your content before adding details
                  </p>
                </div>

                <div className="bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoFile.preview}
                    controls
                    className="w-full h-auto max-h-96"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 1; // Set to 1 second for thumbnail
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      File Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File name:</span>
                        <span className="font-medium">
                          {videoFile.file.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File size:</span>
                        <span className="font-medium">
                          {(videoFile.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">
                          {videoFile.file.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Thumbnail
                    </h3>
                    <div className="space-y-3">
                      {thumbnailFile ? (
                        <div className="relative">
                          <img
                            src={thumbnailFile.preview || "/placeholder.svg"}
                            alt="Thumbnail"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setThumbnailFile(null)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">
                            No thumbnail selected
                          </p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateThumbnail}
                          className="flex-1 bg-transparent"
                        >
                          Auto Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="flex-1"
                        >
                          Upload Custom
                        </Button>
                      </div>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailSelect(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Video Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Add Video Details
                  </h2>
                  <p className="text-gray-600">
                    Provide information about your video
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={videoDetails.title}
                        onChange={(e) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Enter video title"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description * </Label>
                      <Textarea
                        id="description"
                        value={videoDetails.description}
                        onChange={(e) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe your video..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags * </Label>
                      <Input
                        id="tags"
                        value={videoDetails.tags}
                        onChange={(e) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            tags: e.target.value,
                          }))
                        }
                        placeholder="tag1, tag2, tag3"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate tags with commas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={videoDetails.category}
                        onValueChange={(value) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entertainment">
                            Entertainment
                          </SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="privacy">Privacy</Label>
                      <Select
                        value={videoDetails.privacy}
                        onValueChange={(value) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            privacy: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center space-x-2">
                              <Lock className="w-4 h-4" />
                              <span> Public</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="unlisted">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4" />
                              <span>Unlisted</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center space-x-2">
                              <Globe className="w-4 h-4" />
                              <span>Private</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* <div>
                      <Label htmlFor="scheduledDate">Schedule (Optional)</Label>
                      <Input
                        id="scheduledDate"
                        type="datetime-local"
                        value={videoDetails.scheduledDate}
                        onChange={(e) =>
                          setVideoDetails((prev) => ({
                            ...prev,
                            scheduledDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div> */}

                    {thumbnailFile && (
                      <div>
                        <Label>Thumbnail Preview </Label>
                        <div className="mt-1">
                          <img
                            src={thumbnailFile.preview || "/placeholder.svg"}
                            alt="Thumbnail"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!videoDetails.title.trim()}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Uploading */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Uploading Your Video
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we process your upload
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Upload Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>

                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        Processing your video...
                      </p>
                      <p className="text-sm text-blue-700">
                        This may take a few minutes depending on file size
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 5 && uploadSuccess && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upload Successful!
                  </h2>
                  <p className="text-gray-600">
                    Your video has been uploaded and is ready for review
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-green-900 mb-2">
                    What happens next?
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Your video is now in the review queue</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>
                        Team members will review and approve your content
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>
                        Once approved, it will be published to YouTube
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={resetUpload}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Upload Another
                  </Button>
                  <Button asChild>
                    <a href="/dashboard/videos">View My Videos</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
