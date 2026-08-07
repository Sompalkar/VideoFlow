"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Sparkles,
  ImageIcon,
  Wand2,
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

export default function ThumbnailGeneratorPage() {
  const { user } = useAuthStore();
  const {
    uploadedVideos,
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
  const [fontFamily] = useState("Arial");
  const [fontSize] = useState(60);
  const [fontColor] = useState("#FFFFFF");
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">Please log in to access tools</h1>
      </div>
    );
  }

  const sectionHeader = "flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-widest";

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE] font-sans">
      <div className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8 border-b border-stone-900/10 pb-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-700 mb-2">AI Studio</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-teal-700" />
            Thumbnail Generator
          </h1>
          <p className="text-stone-500 mt-2">Turn any frame into a scroll-stopping thumbnail with AI.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 rounded-2xl border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isEnhancing || enhancementStatus) && (
          <div className="mb-4 p-3.5 bg-teal-700/5 border border-teal-700/15 rounded-2xl">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
              <span className="text-sm font-semibold text-teal-800">
                {enhancementStatus || "Enhancing thumbnail with AI..."}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: Controls */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
            <Card className="rounded-2xl shadow-sm border border-stone-900/8 bg-white">
              <CardHeader className="bg-[#FAF6EE] border-b border-stone-100 p-4 rounded-t-2xl">
                <CardTitle className={sectionHeader}>
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  AI Enhancement Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-stone-700 font-medium text-xs uppercase tracking-widest">AI Prompt</Label>
                  <Textarea
                    placeholder="Describe how to enhance this frame..."
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    rows={2}
                    className="mt-1.5 text-sm rounded-xl border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30"
                  />
                </div>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isEnhancing}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-full h-11 font-semibold shadow-lg shadow-teal-900/15"
                >
                  {isEnhancing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Enhance with AI</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border border-stone-900/8 bg-white">
              <CardHeader className="bg-[#FAF6EE] border-b border-stone-100 p-4 rounded-t-2xl">
                <CardTitle className={sectionHeader}>
                  <Layers className="w-4 h-4 text-stone-400" />
                  Select Source Video
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {uploadedVideos.length === 0 ? (
                  <div className="text-center text-stone-500 text-sm py-8 font-medium">
                    No uploaded videos found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[220px] overflow-y-auto pr-2">
                    {uploadedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={cn(
                          "border rounded-xl cursor-pointer transition-all p-2 flex flex-col items-center bg-[#FAF6EE]",
                          selectedVideoForThumbnail?.id === video.id
                            ? "border-teal-600 ring-1 ring-teal-600 bg-teal-700/5"
                            : "border-stone-200 hover:border-teal-400"
                        )}
                        onClick={() => handleSelectUploadedVideo(video)}
                      >
                        <video src={video.cloudinaryVideoUrl} className="w-full h-24 object-cover mb-2 rounded-lg border border-stone-200" muted playsInline />
                        <div className="text-xs text-center text-stone-900 truncate w-full font-semibold">
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
                <Card className="rounded-2xl shadow-sm border border-stone-900/8 bg-white">
                  <CardHeader className="bg-[#FAF6EE] border-b border-stone-100 p-4 rounded-t-2xl">
                    <CardTitle className={sectionHeader}>
                      <Video className="w-4 h-4 text-stone-400" />
                      Video Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <video src={selectedVideoForThumbnail.cloudinaryVideoUrl} className="w-full h-32 object-cover rounded-xl border border-stone-200 mb-3 bg-black" controls />
                    <div className="text-sm text-center text-stone-900 font-semibold truncate">
                      {selectedVideoForThumbnail.title}
                    </div>
                  </CardContent>
                </Card>

                {isExtracting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-700" /> Extracting frames...
                  </div>
                )}

                {frames.length > 0 && (
                  <Card className="rounded-2xl shadow-sm border border-stone-900/8 bg-white">
                    <CardHeader className="bg-[#FAF6EE] border-b border-stone-100 p-4 rounded-t-2xl">
                      <CardTitle className={sectionHeader}>
                        <ImageIcon className="w-4 h-4 text-stone-400" />
                        Select Frame
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {frames.map((frame, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-xl overflow-hidden cursor-pointer transition-all bg-[#FAF6EE]",
                              selectedFrame?.url === frame.url
                                ? "border-teal-600 ring-1 ring-teal-600"
                                : "border-stone-200 hover:border-teal-400"
                            )}
                            onClick={() => handleFrameSelect(frame)}
                          >
                            <img src={frame.url} alt={`Frame ${idx + 1}`} className="w-full h-20 object-cover border-b border-stone-200" />
                            <div className="text-center text-xs text-stone-600 font-semibold py-1.5 uppercase tracking-widest">
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
            <div className="sticky top-24">
              <Card className="bg-white shadow-sm border border-stone-900/8 rounded-2xl flex flex-col">
                <CardHeader className="bg-[#FAF6EE] border-b border-stone-100 p-4 shrink-0 rounded-t-2xl">
                  <CardTitle className={sectionHeader}>
                    <Wand2 className="w-4 h-4 text-teal-700" />
                    Generated Thumbnails
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 flex-1 flex flex-col gap-8">
                  <div className="w-full">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                      AI Enhanced Result
                    </h3>
                    {aiResult ? (
                      <div className="p-4 border border-stone-200 bg-[#FAF6EE] rounded-2xl flex flex-col gap-3">
                        <img src={aiResult.url} alt="AI Enhanced" className="w-full h-40 object-cover rounded-xl border border-stone-200 bg-stone-200" />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" onClick={() => handlePreviewThumbnail(aiResult.url)} className="flex-1 bg-white border border-stone-300 text-stone-900 hover:bg-stone-50 rounded-full font-semibold">
                            <Eye className="w-3.5 h-3.5 mr-2 text-stone-400" /> Preview
                          </Button>
                          <Button size="sm" onClick={() => handleDownload(aiResult.url, "ai-enhanced.png")} className="flex-1 bg-white border border-stone-300 text-stone-900 hover:bg-stone-50 rounded-full font-semibold">
                            <Download className="w-3.5 h-3.5 mr-2 text-stone-400" /> Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-400 text-sm py-12 flex flex-col items-center justify-center border border-dashed border-stone-300 rounded-2xl bg-[#FAF6EE] font-medium text-center px-4">
                        <Sparkles className="w-6 h-6 mb-2 text-stone-300" />
                        Complete the workflow to generate
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                      Final Thumbnail
                    </h3>
                    {finalThumbnail ? (
                      <div className="p-4 border border-stone-200 bg-[#FAF6EE] rounded-2xl flex flex-col gap-3">
                        <img src={finalThumbnail} alt="Final Thumbnail" className="w-full h-40 object-cover rounded-xl border border-stone-200 bg-stone-200" />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" onClick={() => handlePreviewThumbnail(finalThumbnail)} className="flex-1 bg-white border border-stone-300 text-stone-900 hover:bg-stone-50 rounded-full font-semibold px-2">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" onClick={() => handleDownload(finalThumbnail, "final-thumbnail.png")} className="flex-1 bg-white border border-stone-300 text-stone-900 hover:bg-stone-50 rounded-full font-semibold px-2">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" onClick={handleSetAsMainThumbnail} className="flex-[2] bg-teal-700 hover:bg-teal-800 text-white rounded-full font-semibold">
                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> Set Main
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-400 text-sm py-12 flex flex-col items-center justify-center border border-dashed border-stone-300 rounded-2xl bg-[#FAF6EE] font-medium text-center px-4">
                        <ImageIcon className="w-6 h-6 mb-2 text-stone-300" />
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
              className="border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 shadow-lg rounded-full px-6 h-11 font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-stone-400" /> Start Over
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-white rounded-2xl border-stone-200">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-semibold text-stone-900">Success!</DialogTitle>
              <DialogDescription className="text-stone-500">Thumbnail set as the main thumbnail.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)} className="rounded-full bg-teal-700 hover:bg-teal-800 text-white font-semibold">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl bg-white rounded-2xl border-stone-200 p-0 overflow-hidden">
            <div className="bg-stone-900 w-full flex items-center justify-center p-4">
              {previewThumbnail && (
                <img src={previewThumbnail} alt="Thumbnail preview" className="max-w-full max-h-[70vh] object-contain rounded-lg border border-stone-800" />
              )}
            </div>
            <div className="p-4 flex justify-end gap-2 bg-white border-t border-stone-200">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)} className="rounded-full border-stone-300 text-stone-900 font-semibold">Close</Button>
              {previewThumbnail && (
                <Button onClick={() => { handleDownload(previewThumbnail, "thumbnail-preview.png"); setShowPreviewModal(false); }} className="rounded-full bg-teal-700 hover:bg-teal-800 text-white font-semibold">
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
