"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MainNav } from "@/components/main-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Sparkles,
  ImageIcon,
  Wand2,
  Type,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Video,
  Layers,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAIThumbnailStore } from "@/lib/stores/ai-thumbnail-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useCloudinaryStore } from "@/lib/stores/cloudinary-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Frame {
  url: string;
  timestamp: number;
}

interface GeneratedThumbnail {
  url: string;
  publicId: string;
  style?: string;
  prompt?: string;
}

export default function ThumbnailGeneratorPage() {
  const { user } = useAuthStore();
  const {
    uploadedVideos,
    isLoading,
    isGenerating,
    isEnhancing,
    error,
    fetchUploadedVideos,
    enhanceFrameWithAI,
    applyOverlay,
    clearError,
  } = useAIThumbnailStore();
  const { fetchVideos } = useVideoStore();
  const { uploadToCloudinary } = useCloudinaryStore();

  const [selectedVideoForThumbnail, setSelectedVideoForThumbnail] =
    useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiService, setAIService] = useState<
    "precise" | "preserve" | "leonardo" | "dalle3" | "stability" | "huggingface"
  >("precise");
  const [overlayText, setOverlayText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(60);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [overlayedUrl, setOverlayedUrl] = useState<string | null>(null);
  const [finalThumbnail, setFinalThumbnail] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [enhancementStatus, setEnhancementStatus] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [aiResult, setAIResult] = useState<{
    url: string;
    publicId: string;
  } | null>(null);

  // 1. Add useEffect to fetch uploaded videos on mount
  useEffect(() => {
    fetchUploadedVideos();
  }, []); // Remove fetchUploadedVideos from dependencies

  // 2. Add handler for selecting an uploaded video
  const handleSelectUploadedVideo = async (video: any) => {
    setSelectedVideoForThumbnail(video);
    setVideoFile(null);
    setFrames([]);
    setSelectedFrame(null);
    setAIResult(null);
    setOverlayedUrl(null);
    setFinalThumbnail(null);
    setIsExtracting(true);
    try {
      const extractedFrames = await extractFramesClientSide(
        video.cloudinaryVideoUrl,
        8,
        true
      );
      setFrames(extractedFrames);
      toast.success(`Extracted ${extractedFrames.length} frames!`);
    } catch (err) {
      toast.error("Failed to extract frames from video.");
    } finally {
      setIsExtracting(false);
    }
  };

  // 3. Update extractFramesClientSide to support maxFrames
  const extractFramesClientSide = async (
    fileOrUrl: File | string,
    maxFrames = 8,
    evenlySpaced = false
  ) => {
    return new Promise<Frame[]>(async (resolve, reject) => {
      try {
        let videoSrc = "";
        if (typeof fileOrUrl === "string") {
          videoSrc = fileOrUrl;
        } else {
          videoSrc = URL.createObjectURL(fileOrUrl);
        }
        const video = document.createElement("video");
        video.src = videoSrc;
        video.crossOrigin = "anonymous";
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 0;
        await new Promise((res, rej) => {
          video.onloadedmetadata = () => res(null);
          video.onerror = () => rej("Failed to load video");
        });
        const duration = video.duration;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const frames: Frame[] = [];
        const width = video.videoWidth;
        const height = video.videoHeight;
        canvas.width = width;
        canvas.height = height;
        let times: number[] = [];
        if (evenlySpaced) {
          // Evenly spaced timestamps
          const step = duration / (maxFrames + 1);
          times = Array.from({ length: maxFrames }, (_, i) =>
            Math.floor((i + 1) * step)
          );
        } else {
          // Every 5 seconds as fallback
          for (let t = 0; t < duration && frames.length < maxFrames; t += 5) {
            times.push(Math.floor(t));
          }
        }
        for (const t of times) {
          video.currentTime = t;
          await new Promise((res) => {
            video.onseeked = () => res(null);
          });
          context?.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          frames.push({ url: dataUrl, timestamp: t });
        }
        resolve(frames);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Handle video file selection
  const handleVideoFileChange = async (file: File) => {
    setVideoFile(file);
    setVideoUrl("");
    setFrames([]);
    setSelectedFrame(null);
    setAIResult(null);
    setOverlayedUrl(null);
    setFinalThumbnail(null);
    setIsExtracting(true);
    try {
      const extractedFrames = await extractFramesClientSide(file, 5);
      setFrames(extractedFrames);
      toast.success(`Extracted ${extractedFrames.length} frames!`);
    } catch (err) {
      toast.error("Failed to extract frames from video.");
    } finally {
      setIsExtracting(false);
    }
  };

  // 1. Update handleFrameSelect to only set selectedFrame, not upload
  const handleFrameSelect = (frame: Frame) => {
    setSelectedFrame(frame);
  };

  // 2. In handleGenerateAI, if selectedFrame.url is a data URL (not already uploaded), upload it to Cloudinary before AI enhancement
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter an AI prompt");
      return;
    }
    if (!selectedFrame) {
      toast.error("Please select a frame first");
      return;
    }
    setEnhancementStatus("Preparing frame for enhancement...");
    let frameUrl = selectedFrame.url;
    // If the frame is a data URL, upload it to Cloudinary
    if (frameUrl.startsWith("data:")) {
      try {
        toast.loading("Uploading selected frame to Cloudinary...");
        const res = await fetch(frameUrl);
        const blob = await res.blob();
        const file = new File([blob], `frame_${selectedFrame.timestamp}.jpg`, {
          type: "image/jpeg",
        });
        const uploadResult = await uploadToCloudinary(file, "image");
        if (uploadResult && uploadResult.data && uploadResult.data.url) {
          frameUrl = uploadResult.data.url;
          setSelectedFrame({
            url: frameUrl,
            timestamp: selectedFrame.timestamp,
          });
          toast.success("Frame uploaded to Cloudinary!");
        } else {
          throw new Error("Upload failed");
        }
      } catch (err) {
        toast.error("Failed to upload frame to Cloudinary.");
        setEnhancementStatus("");
        return;
      }
    }
    setEnhancementStatus("Starting AI enhancement...");
    try {
      const options = {
        style: "enhanced",
        aspectRatio: "16:9",
        service: aiService,
        videoTitle: selectedVideoForThumbnail?.title,
        videoDescription: selectedVideoForThumbnail?.description,
      };
      setEnhancementStatus("Sending to AI service...");
      const result = await enhanceFrameWithAI(frameUrl, aiPrompt, options);
      setEnhancementStatus("Processing AI response...");
      // Fallback: if result is missing or has no url, show selected frame as result
      if (result && result.url) {
        setAIResult(result);
        setFinalThumbnail(result.url);
        setEnhancementStatus("Enhancement completed successfully!");
        toast.success("AI enhancement completed!");
      } else {
        setEnhancementStatus("Enhancement failed");
        setAIResult({
          url: frameUrl,
          publicId: `original_frame_${Date.now()}`,
        });
        setFinalThumbnail(frameUrl);
        toast.success("Using original frame as thumbnail");
      }
    } catch (error) {
      setEnhancementStatus("Enhancement failed");
      setAIResult({ url: frameUrl, publicId: `original_frame_${Date.now()}` });
      setFinalThumbnail(frameUrl);
      toast.success("Using original frame as thumbnail");
    } finally {
      setTimeout(() => setEnhancementStatus(""), 3000);
    }
  };

  const handleApplyOverlay = async () => {
    if (!aiResult) {
      toast.error("Please generate AI enhancement first");
      return;
    }
    try {
      toast.loading("Applying overlay...");
      let finalOverlayText = overlayText;
      if (!finalOverlayText && selectedVideoForThumbnail) {
        finalOverlayText = selectedVideoForThumbnail.title || "Amazing Video";
      }
      const url = await applyOverlay(aiResult.publicId, {
        text: finalOverlayText,
        fontFamily,
        fontSize,
        fontColor,
      });
      if (url) {
        setOverlayedUrl(url);
        setFinalThumbnail(url);
        toast.success("Overlay applied successfully!");
      } else {
        toast.error("Failed to apply overlay");
      }
    } catch (error) {
      toast.error("Failed to apply overlay");
    }
  };

  const handleSetAsMainThumbnail = async () => {
    if (!finalThumbnail || !selectedVideoForThumbnail) {
      toast.error("Please complete the thumbnail generation first");
      return;
    }
    try {
      toast.loading("Setting as main thumbnail...");
      const response = await fetch(
        `http://localhost:5000/api/videos/${selectedVideoForThumbnail.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            cloudinaryThumbnailUrl: finalThumbnail,
            thumbnail: finalThumbnail,
          }),
        }
      );
      if (response.ok) {
        toast.success("Thumbnail set as main thumbnail!");
        setShowPreviewDialog(true);
        fetchVideos();
      } else {
        toast.error("Failed to set as main thumbnail");
      }
    } catch (error) {
      toast.error("Failed to set as main thumbnail");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handlePreviewThumbnail = (url: string) => {
    setPreviewThumbnail(url);
    setShowPreviewModal(true);
  };

  const resetWorkflow = () => {
    setSelectedVideoForThumbnail(null);
    setVideoFile(null);
    setVideoUrl("");
    setFrames([]);
    setSelectedFrame(null);
    setAIResult(null);
    setOverlayedUrl(null);
    setFinalThumbnail(null);
    setAIPrompt("");
    setOverlayText("");
    clearError();
    toast.success("Workflow reset!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-800">
      <MainNav />
      <DashboardNav />
      <div className="flex-1 max-w-[1400px] mx-auto px-4 py-2">
        <div className="mb-2">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            AI Thumbnail Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create stunning thumbnails with AI-powered tools
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isEnhancing || enhancementStatus) && (
          <div className="mb-2 p-1.5 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              <span className="text-sm text-teal-700 dark:text-teal-300">
                {enhancementStatus || "Enhancing thumbnail with AI..."}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-[calc(100vh-120px)]">
          {/* Left Column: Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* 1. Move AI Enhancement section to the top of the left column */}
            <Card className="shadow-sm rounded-lg mb-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 border-0">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg p-1.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  AI Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1.5 space-y-1.5">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    AI Service
                  </Label>
                  <Select
                    value={aiService}
                    onValueChange={(value: any) => setAIService(value)}
                  >
                    <SelectTrigger className="mt-0.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="precise">Precise</SelectItem>
                      <SelectItem value="preserve">Preserve</SelectItem>
                      <SelectItem value="leonardo">Leonardo AI</SelectItem>
                      <SelectItem value="dalle3">DALL-E 3</SelectItem>
                      <SelectItem value="stability">Stability AI</SelectItem>
                      <SelectItem value="huggingface">HuggingFace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 text-xs">
                    AI Prompt
                  </Label>
                  <Textarea
                    placeholder="Describe how to enhance this frame..."
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    rows={2}
                    className="mt-0.5 text-sm"
                  />
                </div>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 text-sm py-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-4 w-4" />
                      Enhance with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            {/* 2. Place video selection, preview, and frames grid below, with no extra white backgrounds (remove bg-white from their Card classes) */}
            <Card className="dark:bg-gray-900 shadow-sm rounded-lg mb-2 border-0">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg p-1.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-8" />
                  Select Uploaded Video
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {uploadedVideos.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                    No uploaded videos found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={cn(
                          "border rounded-lg cursor-pointer transition-all hover:shadow-lg p-2 flex flex-col items-center",
                          selectedVideoForThumbnail?.id === video.id
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400"
                            : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                        )}
                        onClick={() => handleSelectUploadedVideo(video)}
                      >
                        <video
                          src={video.cloudinaryVideoUrl}
                          className="w-full h-32 object-cover rounded-md mb-2 shadow"
                          muted
                          playsInline
                        />
                        <div className="text-xs text-center text-gray-700 dark:text-gray-300 truncate w-full font-medium">
                          {video.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {selectedVideoForThumbnail && (
              <>
                <Card className="dark:bg-gray-900 shadow-sm rounded-lg mb-2 border-0">
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg p-1.5">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Video className="w-4 h-8" />
                      Video Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <video
                      src={selectedVideoForThumbnail.cloudinaryVideoUrl}
                      className="w-full h-48 object-cover rounded-md shadow mb-2"
                      controls
                    />
                    <div className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium">
                      {selectedVideoForThumbnail.title}
                    </div>
                  </CardContent>
                </Card>
                {frames.length > 0 && (
                  <Card className="dark:bg-gray-900 shadow-sm rounded-lg mb-2 border-0">
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg p-1.5">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <ImageIcon className="w-4 h-8" />
                        Select Frame
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {frames.map((frame, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-md cursor-pointer transition-all hover:shadow-md",
                              selectedFrame?.url === frame.url
                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400"
                                : "border-gray-200 dark:border-gray-700 hover:border-teal-300"
                            )}
                            onClick={() => handleFrameSelect(frame)}
                          >
                            <img
                              src={frame.url}
                              alt={`Frame ${idx + 1}`}
                              className="w-full h-16 object-cover rounded-t-md"
                            />
                            <div className="text-center text-xs text-gray-600 dark:text-gray-400 py-0.5">
                              {frame.timestamp}s
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Column: Generated Thumbnails */}
          <div className="lg:col-span-3">
            <Card className="bg-white dark:bg-gray-900 shadow-sm rounded-lg h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg p-1.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Generated Thumbnails
                </CardTitle>
              </CardHeader>
              {/* Replace the CardContent in the right column with a vertical stack, left-aligned, with expert styling */}
              <CardContent className="p-6 flex-1 flex flex-col items-start justify-start gap-6">
                <div className="w-full">
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-teal-500" />
                    AI Enhanced Result
                  </h3>
                  {aiResult ? (
                    <div className="rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 p-3 shadow-sm flex flex-col gap-2">
                      <img
                        src={aiResult.url}
                        alt="AI Enhanced"
                        className="w-full h-40 object-cover rounded-md shadow-md border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          onClick={() => handlePreviewThumbnail(aiResult.url)}
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 border-0 shadow"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleDownload(aiResult.url, "ai-enhanced.png")
                          }
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-0 shadow"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm py-8 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
                      Complete the workflow to generate thumbnails
                    </div>
                  )}
                </div>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <div className="w-full">
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Final Thumbnail
                  </h3>
                  {finalThumbnail ? (
                    <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 p-3 shadow-sm flex flex-col gap-2">
                      <img
                        src={finalThumbnail}
                        alt="Final Thumbnail"
                        className="w-full h-40 object-cover rounded-md shadow-md border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          onClick={() => handlePreviewThumbnail(finalThumbnail)}
                          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 border-0 shadow"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleDownload(
                              finalThumbnail,
                              "final-thumbnail.png"
                            )
                          }
                          className="bg-gradient-to-r from-pink-600 to-red-600 text-white hover:from-pink-700 hover:to-red-700 border-0 shadow"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSetAsMainThumbnail}
                          className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white hover:from-teal-800 hover:to-cyan-800 border-0 shadow"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Set as Main
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm py-8 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
                      No final thumbnail yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Move the Start Over button to a floating position at the bottom left of the main content area */}
        {selectedVideoForThumbnail && (
          <div className="fixed left-8 bottom-8 z-50">
            <Button
              variant="outline"
              onClick={resetWorkflow}
              className="border-2 border-transparent bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 shadow-md rounded-full px-6 py-2 font-semibold"
              style={{ boxShadow: "0 2px 16px 0 rgba(0, 200, 200, 0.08)" }}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Start Over
            </Button>
          </div>
        )}

        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-white dark:bg-gray-900 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-800 dark:text-gray-200">
                Thumbnail Set Successfully!
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Your new thumbnail has been set as the main thumbnail for this
                video.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setShowPreviewDialog(false)}
                className="text-sm py-1"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-800 dark:text-gray-200">
                Thumbnail Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {previewThumbnail && (
                <img
                  src={previewThumbnail}
                  alt="Thumbnail preview"
                  className="max-w-full max-h-80 object-contain rounded-md shadow-md"
                />
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
                className="text-sm py-1"
              >
                Close
              </Button>
              {previewThumbnail && (
                <Button
                  onClick={() => {
                    handleDownload(previewThumbnail, "thumbnail-preview.png");
                    setShowPreviewModal(false);
                  }}
                  className="text-sm py-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
