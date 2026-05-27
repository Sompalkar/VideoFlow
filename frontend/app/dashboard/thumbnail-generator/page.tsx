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

  const [selectedVideoForThumbnail, setSelectedVideoForThumbnail] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [aiPrompt, setAIPrompt] = useState("");
  const aiService = "huggingface";
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
  const [aiResult, setAIResult] = useState<{ url: string; publicId: string } | null>(null);

  useEffect(() => {
    fetchUploadedVideos();
  }, []);

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
      const extractedFrames = await extractFramesClientSide(video.cloudinaryVideoUrl, 8, true);
      setFrames(extractedFrames);
      toast.success(`Extracted ${extractedFrames.length} frames!`);
    } catch (err) {
      toast.error("Failed to extract frames from video.");
    } finally {
      setIsExtracting(false);
    }
  };

  const extractFramesClientSide = async (fileOrUrl: File | string, maxFrames = 8, evenlySpaced = false) => {
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
          const step = duration / (maxFrames + 1);
          times = Array.from({ length: maxFrames }, (_, i) => Math.floor((i + 1) * step));
        } else {
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

  const handleFrameSelect = (frame: Frame) => {
    setSelectedFrame(frame);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter an AI prompt");
      return;
    }
    setEnhancementStatus("Preparing for generation...");
    let frameUrl = selectedFrame?.url || "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    if (selectedFrame && frameUrl.startsWith("data:")) {
      try {
        toast.loading("Uploading selected frame to Cloudinary...");
        const res = await fetch(frameUrl);
        const blob = await res.blob();
        const file = new File([blob], `frame_${selectedFrame.timestamp}.jpg`, { type: "image/jpeg" });
        const uploadResult = await uploadToCloudinary(file, "image");
        if (uploadResult && uploadResult.data && uploadResult.data.url) {
          frameUrl = uploadResult.data.url;
          setSelectedFrame({ url: frameUrl, timestamp: selectedFrame.timestamp });
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
      if (result && result.url) {
        setAIResult(result);
        setFinalThumbnail(result.url);
        setEnhancementStatus("Enhancement completed successfully!");
        toast.success("AI enhancement completed!");
      } else {
        setEnhancementStatus("Enhancement failed");
        setAIResult({ url: frameUrl, publicId: `original_frame_${Date.now()}` });
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
      const url = await applyOverlay(aiResult.publicId, { text: finalOverlayText, fontFamily, fontSize, fontColor });
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
      const response = await fetch(`http://localhost:5000/api/videos/${selectedVideoForThumbnail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cloudinaryThumbnailUrl: finalThumbnail, thumbnail: finalThumbnail }),
      });
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Please log in to access tools</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans">
      <div className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <div className="mb-6 border-b border-zinc-200 pb-4">
          <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2 tracking-tight">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Thumbnail Generator
          </h1>
          <p className="text-zinc-500 mt-1 text-sm font-semibold uppercase tracking-wider">
            Create stunning thumbnails with AI
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 rounded-none border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isEnhancing || enhancementStatus) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {enhancementStatus || "Enhancing thumbnail with AI..."}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: Controls */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
            
            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Enhancement Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-zinc-900 font-bold text-xs uppercase tracking-widest">
                    AI Prompt
                  </Label>
                  <Textarea
                    placeholder="Describe how to enhance this frame..."
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    rows={2}
                    className="mt-1 text-sm rounded-none border-zinc-300 focus-visible:ring-blue-600"
                  />
                </div>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isEnhancing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none h-10 font-bold"
                >
                  {isEnhancing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Enhance with AI</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  Select Source Video
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {uploadedVideos.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-8 font-semibold">
                    No uploaded videos found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[220px] overflow-y-auto pr-2">
                    {uploadedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={cn(
                          "border rounded-none cursor-pointer transition-all p-2 flex flex-col items-center bg-zinc-50",
                          selectedVideoForThumbnail?.id === video.id
                            ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50"
                            : "border-zinc-200 hover:border-blue-400"
                        )}
                        onClick={() => handleSelectUploadedVideo(video)}
                      >
                        <video src={video.cloudinaryVideoUrl} className="w-full h-24 object-cover mb-2 border border-zinc-200" muted playsInline />
                        <div className="text-xs text-center text-zinc-900 truncate w-full font-bold">
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
                <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
                  <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest">
                      <Video className="w-4 h-4 text-zinc-400" />
                      Video Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <video src={selectedVideoForThumbnail.cloudinaryVideoUrl} className="w-full h-32 object-cover border border-zinc-200 mb-3 bg-black" controls />
                    <div className="text-sm text-center text-zinc-900 font-bold truncate">
                      {selectedVideoForThumbnail.title}
                    </div>
                  </CardContent>
                </Card>

                {frames.length > 0 && (
                  <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4">
                      <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest">
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                        Select Frame
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {frames.map((frame, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-none cursor-pointer transition-all bg-zinc-50",
                              selectedFrame?.url === frame.url
                                ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50"
                                : "border-zinc-200 hover:border-blue-400"
                            )}
                            onClick={() => handleFrameSelect(frame)}
                          >
                            <img src={frame.url} alt={`Frame ${idx + 1}`} className="w-full h-20 object-cover border-b border-zinc-200" />
                            <div className="text-center text-xs text-zinc-600 font-bold py-1.5 uppercase tracking-widest">
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
          <div className="lg:col-span-2 min-w-0">
            <div className="sticky top-6">
              <Card className="bg-white shadow-none border border-zinc-200 rounded-none flex flex-col">
                <CardHeader className="bg-zinc-50 border-b border-zinc-200 p-4 shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest">
                  <Wand2 className="w-4 h-4 text-blue-600" />
                  Generated Thumbnails
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 flex-1 flex flex-col gap-8">
                
                <div className="w-full">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                    AI Enhanced Result
                  </h3>
                  {aiResult ? (
                    <div className="p-4 border border-zinc-200 bg-zinc-50 flex flex-col gap-3">
                      <img src={aiResult.url} alt="AI Enhanced" className="w-full h-40 object-cover border border-zinc-200 bg-zinc-200" />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="sm" onClick={() => handlePreviewThumbnail(aiResult.url)} className="flex-1 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-none font-bold">
                          <Eye className="w-3.5 h-3.5 mr-2 text-zinc-400" /> Preview
                        </Button>
                        <Button size="sm" onClick={() => handleDownload(aiResult.url, "ai-enhanced.png")} className="flex-1 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-none font-bold">
                          <Download className="w-3.5 h-3.5 mr-2 text-zinc-400" /> Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-sm py-12 flex flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 font-semibold text-center px-4">
                      <Sparkles className="w-6 h-6 mb-2 text-zinc-300" />
                      Complete the workflow to generate
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                    Final Thumbnail
                  </h3>
                  {finalThumbnail ? (
                    <div className="p-4 border border-zinc-200 bg-zinc-50 flex flex-col gap-3">
                      <img src={finalThumbnail} alt="Final Thumbnail" className="w-full h-40 object-cover border border-zinc-200 bg-zinc-200" />
                      <div className="flex flex-col sm:flex-row gap-2">
                         <Button size="sm" onClick={() => handlePreviewThumbnail(finalThumbnail)} className="flex-1 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-none font-bold px-2">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => handleDownload(finalThumbnail, "final-thumbnail.png")} className="flex-1 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-none font-bold px-2">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" onClick={handleSetAsMainThumbnail} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold">
                          <CheckCircle className="w-3.5 h-3.5 mr-2" /> Set Main
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-sm py-12 flex flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 font-semibold text-center px-4">
                      <ImageIcon className="w-6 h-6 mb-2 text-zinc-300" />
                      No final thumbnail yet
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
            </div>
          </div>
        </div>

        {selectedVideoForThumbnail && (
          <div className="fixed left-6 bottom-6 z-50">
            <Button
              variant="outline"
              onClick={resetWorkflow}
              className="border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm rounded-none px-6 h-10 font-bold uppercase tracking-widest text-xs"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-zinc-400" /> Start Over
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-white rounded-none border-zinc-200">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 font-bold">Success!</DialogTitle>
              <DialogDescription className="text-zinc-500">Thumbnail set as the main thumbnail.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)} className="rounded-none bg-blue-600 text-white font-bold">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl bg-white rounded-none border-zinc-200 p-0 overflow-hidden">
            <div className="bg-zinc-900 w-full flex items-center justify-center p-4">
              {previewThumbnail && (
                <img src={previewThumbnail} alt="Thumbnail preview" className="max-w-full max-h-[70vh] object-contain border border-zinc-800" />
              )}
            </div>
            <div className="p-4 flex justify-end gap-2 bg-white border-t border-zinc-200">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)} className="rounded-none border-zinc-200 text-zinc-900 font-bold">Close</Button>
              {previewThumbnail && (
                <Button onClick={() => { handleDownload(previewThumbnail, "thumbnail-preview.png"); setShowPreviewModal(false); }} className="rounded-none bg-blue-600 text-white font-bold">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
