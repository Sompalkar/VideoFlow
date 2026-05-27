"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
  Upload,
  Video,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Globe,
  Lock,
  Loader2,
  Film,
  Type,
  List,
  Tags,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useCloudinaryStore } from "@/lib/stores/cloudinary-store";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VideoFile {
  file: File;
  preview: string;
}

interface ThumbnailFile {
  file: File;
  preview: string;
}

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
  return file.type.startsWith("image/") ? "image" : "video";
}

export default function UploadPage() {
  const { user } = useAuthStore();
  const { uploadVideo } = useVideoStore();
  const { uploadToCloudinary, uploadProgress } = useCloudinaryStore();

  const [step, setStep] = useState<"form" | "uploading" | "success">("form");
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<ThumbnailFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [videoDetails, setVideoDetails] = useState({
    title: "",
    description: "",
    tags: "",
    category: "entertainment",
    privacy: "public",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
      setError("File size must be less than 500MB");
      return;
    }

    const preview = URL.createObjectURL(file);
    setVideoFile({ file, preview });
    setVideoDetails((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
    setError("");
  };

  const handleThumbnailSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
    const preview = URL.createObjectURL(file);
    setThumbnailFile({ file, preview });
  };

  const handleUpload = async () => {
    if (!videoFile || !user || !videoDetails.title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError("");
      setStep("uploading");

      const videoResourceType = getResourceType(videoFile.file);
      const videoResult = await uploadToCloudinary(videoFile.file, videoResourceType);

      let thumbnailResult: any = null;
      if (thumbnailFile) {
        const thumbResourceType = getResourceType(thumbnailFile.file);
        thumbnailResult = await uploadToCloudinary(thumbnailFile.file, thumbResourceType);
      }

      const uploadPayload = {
        title: videoDetails.title,
        description: videoDetails.description,
        tags: videoDetails.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
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
        fileSize: videoResult?.data?.bytes || videoResult?.bytes || videoFile.file.size,
        duration: videoResult?.data?.duration || videoResult?.duration || 0,
      };

      await uploadVideo(uploadPayload);
      setStep("success");
    } catch (err) {
      /* console log removed */
      if (err instanceof Error && err.message.toLowerCase().includes("invalid file type")) {
        setError("The file you selected is not a valid video or image.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
      setStep("form");
      setIsSubmitting(false);
    }
  };

  const resetUpload = () => {
    setStep("form");
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoDetails({
      title: "",
      description: "",
      tags: "",
      category: "entertainment",
      privacy: "public",
    });
    setError("");
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Please log in to upload videos
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-b border-zinc-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950 tracking-tight flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload New Video
            </h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider font-semibold">
              Share your content with the world
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-none border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {step === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: File Selection & Preview */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              <Card className="shadow-sm border border-zinc-200 rounded-none bg-white">
                <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                    <Film className="w-4 h-4 text-blue-600" />
                    Source File
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {!videoFile ? (
                    <div
                      className={`border-2 border-dashed rounded-none p-8 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-zinc-300 hover:border-blue-400 bg-zinc-50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 mb-1">
                        Select or drop video
                      </h3>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                        MP4, MOV, AVI (Max 500MB)
                      </p>
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
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-video bg-black border border-zinc-200 group">
                        <video 
                          src={videoFile.preview} 
                          className="w-full h-full object-contain"
                          controls
                        />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => setVideoFile(null)} 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-none h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3 flex flex-col gap-1">
                        <p className="text-sm font-bold text-zinc-900 truncate" title={videoFile.file.name}>{videoFile.file.name}</p>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{(videoFile.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-zinc-200 rounded-none bg-white">
                <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Custom Thumbnail
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {thumbnailFile ? (
                    <div className="relative aspect-video border border-zinc-200 group bg-black">
                      <img
                        src={thumbnailFile.preview}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setThumbnailFile(null)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-none h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-zinc-300 p-6 text-center bg-zinc-50 hover:border-blue-400 cursor-pointer transition-all"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Upload Image</p>
                      <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-widest">16:9 Recommended</p>
                    </div>
                  )}
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
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Video Details Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border border-zinc-200 rounded-none bg-white h-full flex flex-col">
                <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4 shrink-0">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-600" />
                    Video Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col gap-6">
                  
                  <div>
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Title *</Label>
                    <Input
                      id="title"
                      value={videoDetails.title}
                      onChange={(e) => setVideoDetails((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a catchy title"
                      className="rounded-none border-zinc-300 focus-visible:ring-blue-600 h-10 font-medium text-base"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Description</Label>
                    <Textarea
                      id="description"
                      value={videoDetails.description}
                      onChange={(e) => setVideoDetails((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell viewers about your video..."
                      rows={5}
                      className="rounded-none border-zinc-300 focus-visible:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Tags</Label>
                    <div className="relative">
                      <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="tags"
                        value={videoDetails.tags}
                        onChange={(e) => setVideoDetails((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="gaming, tutorial, review (comma separated)"
                        className="rounded-none border-zinc-300 focus-visible:ring-blue-600 h-10 pl-9 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-auto">
                    <div>
                      <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Category</Label>
                      <Select
                        value={videoDetails.category}
                        onValueChange={(val) => setVideoDetails((prev) => ({ ...prev, category: val }))}
                      >
                        <SelectTrigger className="rounded-none border-zinc-300 h-10 font-medium bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-zinc-300">
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="privacy" className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Visibility</Label>
                      <Select
                        value={videoDetails.privacy}
                        onValueChange={(val) => setVideoDetails((prev) => ({ ...prev, privacy: val }))}
                      >
                        <SelectTrigger className="rounded-none border-zinc-300 h-10 font-medium bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-zinc-300">
                          <SelectItem value="public">
                            <div className="flex items-center space-x-2 font-medium">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="unlisted">
                            <div className="flex items-center space-x-2 font-medium">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Unlisted</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center space-x-2 font-medium">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Private</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 mt-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {videoFile ? "Ready to publish" : "Waiting for video file"}
                    </p>
                    <Button
                      onClick={handleUpload}
                      disabled={!videoFile || !videoDetails.title.trim() || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 rounded-none text-white px-8 h-10 font-bold tracking-wide uppercase text-xs disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Publish Video
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "uploading" && (
          <Card className="shadow-none border border-zinc-200 rounded-none bg-white py-16">
            <CardContent className="space-y-8 text-center max-w-lg mx-auto">
              <div className="mx-auto w-20 h-20 bg-blue-50 flex items-center justify-center border border-blue-100">
                <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-950 tracking-tight mb-2">
                  {uploadProgress === 100 ? "Processing Video" : "Uploading Video"}
                </h2>
                <p className="text-zinc-500 text-sm font-medium">
                  {uploadProgress === 100 
                    ? "Your file has reached the server and is now being processed by Cloudinary. This may take a few moments depending on file size."
                    : "Please keep this tab open while your file uploads securely."}
                </p>
              </div>

              <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-zinc-700 uppercase tracking-widest text-xs">
                    {uploadProgress === 100 ? "Processing..." : "Transferring..."}
                  </span>
                  <span className="font-bold text-blue-600 text-lg">{uploadProgress}%</span>
                </div>
                <Progress 
                  value={uploadProgress} 
                  className={`h-3 rounded-none bg-zinc-200 border border-zinc-300 [&>div]:bg-blue-600 ${uploadProgress === 100 ? "animate-pulse" : ""}`} 
                />
              </div>

              {uploadProgress === 100 && (
                <div className="flex items-center justify-center space-x-2 text-blue-600 mt-4 bg-blue-50 py-3 border border-blue-100">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-widest">Finalizing processing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="shadow-none border border-zinc-200 rounded-none bg-white py-16">
            <CardContent className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-green-50 flex items-center justify-center mx-auto mb-6 border border-green-200">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-950 tracking-tight mb-3">
                Upload Successful
              </h2>
              <p className="text-zinc-500 mb-10 font-medium">
                Your video has been securely uploaded and processed. It is now available in your dashboard for review.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button onClick={resetUpload} variant="outline" className="rounded-none border-zinc-300 text-zinc-700 font-bold uppercase tracking-widest text-xs h-12 px-8 w-full sm:w-auto hover:bg-zinc-50">
                  Upload Another
                </Button>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold uppercase tracking-widest text-xs h-12 px-8 w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
