"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Youtube,
  Calendar,
  User,
  Clock,
  FileVideo,
  AlertCircle,
  Loader2,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Share2,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { VideoComments } from "@/components/video-comments";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VideoReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentVideo,
    fetchVideoById,
    approveVideo,
    rejectVideo,
    isLoading,
    error,
    clearError,
  } = useVideoStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const videoId = params.id as string;

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleVolumeChange = () => {
    const video = videoRef.current;
    if (video) {
      setVolume(video.volume);
      setIsMuted(video.muted);
    }
  };

  useEffect(() => {
    if (videoId) fetchVideoById(videoId);
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [currentVideo]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    isPlaying ? video.pause() : video.play();
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const handleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;
    if (!isFullscreen) {
      if (player.requestFullscreen) player.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleApprove = async () => {
    if (!currentVideo) return;
    setActionLoading("approve");
    clearError();
    try {
      await approveVideo(currentVideo.id);
      router.push("/dashboard");
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!currentVideo || !rejectionReason.trim()) return;
    setActionLoading("reject");
    clearError();
    try {
      await rejectVideo(currentVideo.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason("");
      router.push("/dashboard");
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-zinc-100 text-zinc-900 border-zinc-300";
      case "approved": return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <Youtube className="w-3.5 h-3.5" />;
      case "approved": return <CheckCircle className="w-3.5 h-3.5" />;
      case "pending": return <Clock className="w-3.5 h-3.5" />;
      case "rejected": return <XCircle className="w-3.5 h-3.5" />;
      default: return <FileVideo className="w-3.5 h-3.5" />;
    }
  };

  if (!user) {
    return (
      <>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 tracking-tight">Please log in to review videos</h1>
            <Link href="/auth/login"><Button className="rounded-none bg-blue-600 hover:bg-blue-700">Go to Login</Button></Link>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </>
    );
  }

  if (!currentVideo) {
    return (
      <>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 tracking-tight">Video not found</h1>
            <Link href="/dashboard"><Button className="rounded-none bg-zinc-900 text-white">Back to Dashboard</Button></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50">
      <div className="flex-1 p-4 max-w-6xl mx-auto w-full flex flex-col gap-4 overflow-hidden">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between bg-white border border-zinc-200 px-4 py-3 shrink-0">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/videos">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900 rounded-none h-8 px-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <h1 className="text-base font-bold text-zinc-900 tracking-tight truncate max-w-[200px] md:max-w-[400px]">
              {currentVideo.title}
            </h1>
            <Badge className={cn("text-xs font-semibold rounded-none border px-2 py-0.5 shadow-none", getStatusColor(currentVideo.status))}>
              {getStatusIcon(currentVideo.status)}
              <span className="ml-1 capitalize">{currentVideo.status}</span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {currentVideo.status === "pending" && user?.role === "creator" && (
              <>
                <Button onClick={handleApprove} disabled={actionLoading !== null} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-none h-8 px-4 text-xs font-semibold">
                  {actionLoading === "approve" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                  Approve
                </Button>
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <Button onClick={() => setShowRejectDialog(true)} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 bg-white rounded-none h-8 px-4 text-xs font-semibold">
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                  <DialogContent className="sm:max-w-md rounded-none border-zinc-200">
                    <DialogHeader>
                      <DialogTitle>Reject Video</DialogTitle>
                      <DialogDescription>Provide a reason for rejecting this video.</DialogDescription>
                    </DialogHeader>
                    <Textarea placeholder="Reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} className="rounded-none border-zinc-300" />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="rounded-none">Cancel</Button>
                      <Button onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading !== null} className="bg-red-600 hover:bg-red-700 text-white rounded-none">
                        {actionLoading === "reject" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Reject Video"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button variant="outline" size="sm" className="rounded-none h-8 border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900"><Share2 className="w-3.5 h-3.5 mr-1" /> Share</Button>
            <Button variant="outline" size="sm" className="rounded-none h-8 border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900"><Download className="w-3.5 h-3.5 mr-1" /> Download</Button>
            {currentVideo.youtubeUrl && (
              <Link href={currentVideo.youtubeUrl} target="_blank">
                <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-none h-8"><Youtube className="w-3.5 h-3.5 mr-1" /> YouTube</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Main Grid: Fits remaining height exactly */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          
          {/* Left Column: Player & Metadata */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 h-full">
            
            {/* Player Container */}
            <div className="relative bg-black border border-zinc-200 shrink-0 flex items-center justify-center" style={{ height: "70%" }}>
              <div ref={playerRef} className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onVolumeChange={handleVolumeChange}
                  onClick={handlePlayPause}
                >
                  <source src={currentVideo.cloudinaryVideoUrl} type="video/mp4" />
                </video>
                
                {/* Minimal Overlay Controls */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 transition-opacity duration-300",
                    showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                  onMouseMove={showControlsTemporarily}
                  onMouseLeave={() => setShowControls(false)}
                >
                  <button onClick={handlePlayPause} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center text-white bg-black/50 hover:bg-black/70 transition-colors">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>

                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2">
                    <div className="h-1.5 bg-white/30 cursor-pointer w-full" onClick={handleSeek}>
                      <div className="h-full bg-blue-500 relative" style={{ width: `${(currentTime / duration) * 100}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-white text-xs font-medium">
                      <div className="flex items-center space-x-4">
                        <button onClick={handlePlayPause}>{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                        <button onClick={handleMuteToggle}>{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleSkip(-10)}><SkipBack className="w-3.5 h-3.5" /></button>
                          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                          <button onClick={() => handleSkip(10)}><SkipForward className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <button onClick={handleFullscreen}><Maximize className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section - Uses remaining 50% height */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              
              {/* Info Cards */}
              <Card className="rounded-none border-zinc-200 shadow-none bg-white flex flex-col min-h-0">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Metadata</h3>
                </div>
                <CardContent className="p-4 grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-wider">Uploader</p>
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-900 truncate">{currentVideo.uploadedBy.name}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-wider">Date</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-900">{new Date(currentVideo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-wider">Duration</p>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-900">{formatTime(currentVideo.duration)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-wider">Size</p>
                    <div className="flex items-center space-x-2">
                      <FileVideo className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-900">{(currentVideo.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status History */}
              <Card className="rounded-none border-zinc-200 shadow-none bg-white flex flex-col min-h-0">
                 <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status Log</h3>
                </div>
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 mt-0.5 rounded bg-blue-100 flex items-center justify-center shrink-0">
                      <FileVideo className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Uploaded</p>
                      <p className="text-[10px] text-zinc-500">{new Date(currentVideo.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {currentVideo.approvedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 mt-0.5 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Approved</p>
                        <p className="text-[10px] text-zinc-500">{new Date(currentVideo.approvedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {currentVideo.rejectedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 mt-0.5 rounded bg-red-100 flex items-center justify-center shrink-0">
                        <XCircle className="w-3 h-3 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Rejected</p>
                        <p className="text-[10px] text-zinc-500">{new Date(currentVideo.rejectedAt).toLocaleString()}</p>
                        {currentVideo.rejectionReason && (
                          <p className="text-[10px] text-red-600 mt-1 italic leading-tight border-l-2 border-red-200 pl-2">"{currentVideo.rejectionReason}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Right Column: Comments taking full height of grid */}
          <div className="lg:col-span-1 min-h-0 h-full flex flex-col">
            <Card className="rounded-none border-zinc-200 shadow-none bg-white h-full flex flex-col overflow-hidden">
              <CardContent className="p-0 flex-1 h-full overflow-hidden">
                <VideoComments videoId={currentVideo.id} currentTime={currentTime} onSeekTo={handleSeekTo} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
