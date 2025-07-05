"use client";

import { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MainNav } from "@/components/main-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Sparkles,
  ImageIcon,
  Wand2,
  Palette,
  Type,
  Settings,
  Download,
  RefreshCw,
  Eye,
  Zap,
  Sparkle,
  Palette as PaletteIcon,
  Type as TypeIcon,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAIThumbnailStore } from "@/lib/stores/ai-thumbnail-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { cn } from "@/lib/utils";

interface VideoFile {
  file: File;
  preview: string;
  duration?: number;
}

export default function ThumbnailGeneratorPage() {
  const { user } = useAuthStore();
  const {
    generatedThumbnails,
    selectedThumbnail,
    availableStyles,
    videoAnalysis,
    isLoading,
    isGenerating,
    isEnhancing,
    isAnalyzing,
    error,
    generateThumbnails,
    enhanceThumbnail,
    analyzeVideo,
    getThumbnailStyles,
    selectThumbnail,
    clearThumbnails,
    clearError,
    uploadedVideos,
    selectedVideo,
    fetchUploadedVideos,
    selectVideo,
    uploadVideoFile,
    isUploading,
  } = useAIThumbnailStore();
  const { videos, fetchVideos } = useVideoStore();

  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  const [generationOptions, setGenerationOptions] = useState({
    title: "",
    description: "",
    style: "modern",
    colors: ["#3B82F6", "#EF4444", "#10B981"],
    text: "",
    aspectRatio: "16:9",
  });

  const [enhancementOptions, setEnhancementOptions] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    text: "",
    overlay: false,
  });

  const [inputMode, setInputMode] = useState<"select" | "upload">("select");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getThumbnailStyles();
    fetchUploadedVideos();
    fetchVideos();
  }, [getThumbnailStyles, fetchUploadedVideos, fetchVideos]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) => file.type.startsWith("video/"));
    if (videoFile) {
      handleUploadVideoFile(videoFile);
    }
  };

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      clearError();
      return;
    }
    handleUploadVideoFile(file);
  };

  const handleSelectUploadedVideo = (videoId: string) => {
    const video = uploadedVideos.find((v) => v.id === videoId) || null;
    selectVideo(video);
    setVideoFile(null);
    setVideoUrl(video?.cloudinaryVideoUrl || "");
    setGenerationOptions((prev) => ({
      ...prev,
      title: video?.title || "",
      description: video?.description || "",
    }));
    clearError();
  };

  const handleUploadVideoFile = async (file: File) => {
    try {
      console.log("Starting video upload:", file.name, file.size, file.type);
      const { videoUrl, title } = await uploadVideoFile(file);
      console.log("Upload successful:", videoUrl, title);
      setVideoFile({ file, preview: videoUrl });
      setVideoUrl(videoUrl);
      setGenerationOptions((prev) => ({ ...prev, title }));
      selectVideo(null);
      clearError();
    } catch (e) {
      console.error("Upload failed:", e);
      // error handled in store
    }
  };

  const handleGenerateThumbnails = async () => {
    let videoId = selectedVideo?.id;
    let videoUrlToUse = videoUrl;
    if (inputMode === "upload" && videoFile) {
      // Already uploaded to Cloudinary
      videoId = undefined;
      videoUrlToUse = videoFile.preview;
    } else if (inputMode === "select" && selectedVideo) {
      videoUrlToUse = selectedVideo.cloudinaryVideoUrl;
      videoId = selectedVideo.id;
    }
    if (!videoUrlToUse || !generationOptions.title) return;
    await generateThumbnails(
      videoUrlToUse,
      generationOptions.title,
      generationOptions.description,
      videoId,
      {
        style: generationOptions.style,
        colors: generationOptions.colors,
        text: generationOptions.text,
        aspectRatio: generationOptions.aspectRatio,
      }
    );
  };

  const handleEnhanceThumbnail = async () => {
    if (!selectedThumbnail) return;

    await enhanceThumbnail(selectedThumbnail.url, enhancementOptions);
    setShowEnhanceDialog(false);
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;

    // For now, we'll use a placeholder URL
    const placeholderVideoUrl = "https://example.com/placeholder-video.mp4";
    await analyzeVideo(placeholderVideoUrl);
  };

  const handlePreviewThumbnail = (thumbnailUrl: string) => {
    setPreviewThumbnail(thumbnailUrl);
    setShowPreviewDialog(true);
  };

  const handleDownloadThumbnail = (thumbnailUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = thumbnailUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNav />
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            AI Thumbnail Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create engaging thumbnails for your videos using AI
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video Upload & Options */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Source Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={inputMode === "select" ? "default" : "outline"}
                    onClick={() => setInputMode("select")}
                  >
                    Select Uploaded
                  </Button>
                  <Button
                    variant={inputMode === "upload" ? "default" : "outline"}
                    onClick={() => setInputMode("upload")}
                  >
                    Upload from Device
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Video Selector or Upload */}
            {inputMode === "select" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Select Uploaded Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedVideo?.id || ""}
                    onValueChange={handleSelectUploadedVideo}
                    disabled={uploadedVideos.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a video" />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadedVideos.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVideo && (
                    <video
                      src={selectedVideo.cloudinaryVideoUrl}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Upload Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                      isDragging
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ cursor: "pointer" }}
                  >
                    {videoFile ? (
                      <div className="space-y-3">
                        <video
                          ref={videoRef}
                          src={videoFile.preview}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {videoFile.file.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                            setVideoUrl("");
                          }}
                        >
                          Change Video
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Video className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Drag and drop a video file here, or click to select
                        </p>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Select Video
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleUploadVideoFile(file);
                      }}
                      className="hidden"
                    />
                  </div>
                  {isUploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading video...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generation Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Generation Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={generationOptions.title}
                    onChange={(e) =>
                      setGenerationOptions((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={generationOptions.description}
                    onChange={(e) =>
                      setGenerationOptions((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter video description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="style">Style</Label>
                  <Select
                    value={generationOptions.style}
                    onValueChange={(value) =>
                      setGenerationOptions((prev) => ({
                        ...prev,
                        style: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="text">Custom Text</Label>
                  <Input
                    id="text"
                    value={generationOptions.text}
                    onChange={(e) =>
                      setGenerationOptions((prev) => ({
                        ...prev,
                        text: e.target.value,
                      }))
                    }
                    placeholder="Optional custom text overlay"
                  />
                </div>

                <div>
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select
                    value={generationOptions.aspectRatio}
                    onValueChange={(value) =>
                      setGenerationOptions((prev) => ({
                        ...prev,
                        aspectRatio: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateThumbnails}
                  disabled={
                    (inputMode === "upload" && !videoFile) ||
                    (inputMode === "select" && !selectedVideo) ||
                    !generationOptions.title ||
                    isGenerating
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Thumbnails
                </Button>
              </CardContent>
            </Card>

            {/* Video Analysis Results */}
            {videoAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Suggested Styles</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videoAnalysis.suggestedStyles.map((style) => (
                        <Badge key={style} variant="secondary">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Recommended Text</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videoAnalysis.recommendedText.map((text) => (
                        <Badge key={text} variant="outline">
                          {text}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Dominant Colors</Label>
                    <div className="flex gap-2 mt-2">
                      {videoAnalysis.dominantColors.map((color) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Generated Thumbnails */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Generated Thumbnails
                  </span>
                  {generatedThumbnails.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearThumbnails}
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Generating amazing thumbnails...
                    </p>
                    <Progress value={33} className="mt-4" />
                  </div>
                ) : generatedThumbnails.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Upload a video and generate thumbnails to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedThumbnails.map((thumbnail) => (
                      <div
                        key={thumbnail.id}
                        className={cn(
                          "relative group rounded-lg overflow-hidden border-2 transition-all",
                          selectedThumbnail?.id === thumbnail.id
                            ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <img
                          src={thumbnail.url}
                          alt={`Thumbnail - ${thumbnail.style}`}
                          className="w-full h-48 object-cover"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => selectThumbnail(thumbnail)}
                              variant="secondary"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Select
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handlePreviewThumbnail(thumbnail.url)
                              }
                              variant="secondary"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDownloadThumbnail(
                                  thumbnail.url,
                                  `thumbnail-${thumbnail.style}.jpg`
                                )
                              }
                              variant="secondary"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>

                        {/* Style Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="capitalize">
                            {thumbnail.style}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Thumbnail Actions */}
            {selectedThumbnail && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Selected Thumbnail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedThumbnail.url}
                      alt="Selected thumbnail"
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        Style: {selectedThumbnail.style}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click enhance to customize further
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowEnhanceDialog(true)}
                      disabled={isEnhancing}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Enhance
                    </Button>
                    <Button
                      onClick={() =>
                        handleDownloadThumbnail(
                          selectedThumbnail.url,
                          `thumbnail-${selectedThumbnail.style}.jpg`
                        )
                      }
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enhancement Dialog */}
      <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enhance Thumbnail</DialogTitle>
            <DialogDescription>
              Adjust brightness, contrast, and other properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brightness</Label>
              <Slider
                value={[enhancementOptions.brightness]}
                onValueChange={([value]) =>
                  setEnhancementOptions((prev) => ({
                    ...prev,
                    brightness: value,
                  }))
                }
                max={100}
                min={-100}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Contrast</Label>
              <Slider
                value={[enhancementOptions.contrast]}
                onValueChange={([value]) =>
                  setEnhancementOptions((prev) => ({
                    ...prev,
                    contrast: value,
                  }))
                }
                max={100}
                min={-100}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Saturation</Label>
              <Slider
                value={[enhancementOptions.saturation]}
                onValueChange={([value]) =>
                  setEnhancementOptions((prev) => ({
                    ...prev,
                    saturation: value,
                  }))
                }
                max={100}
                min={-100}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="enhanceText">Custom Text</Label>
              <Input
                id="enhanceText"
                value={enhancementOptions.text}
                onChange={(e) =>
                  setEnhancementOptions((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                placeholder="Add custom text overlay"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="overlay"
                checked={enhancementOptions.overlay}
                onCheckedChange={(checked) =>
                  setEnhancementOptions((prev) => ({
                    ...prev,
                    overlay: checked,
                  }))
                }
              />
              <Label htmlFor="overlay">Add overlay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEnhanceDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEnhanceThumbnail} disabled={isEnhancing}>
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Enhance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Thumbnail Preview</DialogTitle>
            <DialogDescription>
              Preview your generated thumbnail
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {previewThumbnail && (
              <img
                src={previewThumbnail}
                alt="Thumbnail preview"
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
            >
              Close
            </Button>
            {previewThumbnail && (
              <Button
                onClick={() => {
                  handleDownloadThumbnail(
                    previewThumbnail,
                    "thumbnail-preview.jpg"
                  );
                  setShowPreviewDialog(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
