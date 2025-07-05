"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tag,
  AlertCircle,
  Loader2,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Share2,
  Download,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { VideoComments } from "@/components/video-comments";
import { MainNav } from "@/components/main-nav";
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
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | null
  >(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const videoId = params.id as string;

  // Video event handlers
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
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
    if (videoId) {
      fetchVideoById(videoId);
    }
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

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
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
      if (player.requestFullscreen) {
        player.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
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
      router.push("/dashboard?tab=videos");
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
      router.push("/dashboard?tab=videos");
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Youtube className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileVideo className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Please log in to review videos
            </h1>
            <Link href="/auth/login">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!currentVideo) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Video not found</h1>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/videos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Video Review</h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Review and manage video content
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                "text-sm w-fit",
                getStatusColor(currentVideo.status)
              )}
            >
              {getStatusIcon(currentVideo.status)}
              <span className="ml-1 capitalize">{currentVideo.status}</span>
            </Badge>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Video Player and Details - Left Side */}
            <div className="xl:col-span-2 space-y-6">
              {/* Video Player */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative bg-black">
                  <video
                    ref={videoRef}
                      className="w-full h-auto max-h-[600px]"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onVolumeChange={handleVolumeChange}
                    >
                      <source
                    src={currentVideo.cloudinaryVideoUrl}
                        type="video/mp4"
                  />
                      Your browser does not support the video tag.
                    </video>

                  {/* Video Controls Overlay */}
                  <div
                    className={cn(
                        "absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-300",
                        showControls && "bg-opacity-20"
                      )}
                      onMouseMove={showControlsTemporarily}
                      onMouseLeave={() => setShowControls(false)}
                    >
                      {/* Play/Pause Button */}
                      <button
                          onClick={handlePlayPause}
                        className={cn(
                          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white transition-opacity duration-300",
                          showControls ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </button>

                    {/* Bottom Controls */}
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300",
                          showControls ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div
                            className="w-full h-1 bg-gray-600 rounded cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div
                              className="h-full bg-red-600 rounded relative"
                              style={{
                                width: `${(currentTime / duration) * 100}%`,
                              }}
                            >
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
                            </div>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center space-x-4">
                            <button onClick={handlePlayPause}>
                              {isPlaying ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </button>

                            <button onClick={handleMuteToggle}>
                              {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>

                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleSkip(-10)}>
                                <SkipBack className="w-4 h-4" />
                              </button>
                              <span className="text-sm min-w-[80px]">
                                {formatTime(currentTime)} /{" "}
                                {formatTime(duration)}
                              </span>
                              <button onClick={() => handleSkip(10)}>
                                <SkipForward className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button onClick={handleFullscreen}>
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Actions */}
              <Card>
                <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                    {currentVideo.status === "pending" &&
                      user?.role === "creator" && (
                        <>
                          <Button
                            onClick={handleApprove}
                            disabled={actionLoading !== null}
                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-sm"
                          >
                            {actionLoading === "approve" ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>

                          <Dialog
                            open={showRejectDialog}
                            onOpenChange={setShowRejectDialog}
                          >
                            <Button
                              onClick={() => setShowRejectDialog(true)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 flex-1 sm:flex-none bg-transparent text-sm"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Reject Video</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this
                                  video.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Textarea
                                  placeholder="Enter rejection reason..."
                                  value={rejectionReason}
                                  onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                  }
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowRejectDialog(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleReject}
                                  disabled={
                                    !rejectionReason.trim() ||
                                    actionLoading !== null
                                  }
                                  variant="destructive"
                                >
                                  {actionLoading === "reject" ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Rejecting...
                                    </>
                                  ) : (
                                    "Reject Video"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none bg-transparent text-sm"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>

                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none bg-transparent text-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>

                      {currentVideo.youtubeUrl && (
                        <Link href={currentVideo.youtubeUrl} target="_blank">
                          <Button className="bg-red-600 hover:bg-red-700 text-sm">
                            <Youtube className="w-4 h-4 mr-2" />
                            YouTube
                          </Button>
                        </Link>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Video Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">
                          {currentVideo.uploadedBy.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentVideo.uploadedBy.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">Uploaded</p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            currentVideo.uploadedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">Duration</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(currentVideo.duration)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <FileVideo className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">File Size</p>
                        <p className="text-xs text-gray-500">
                          {(currentVideo.fileSize / (1024 * 1024)).toFixed(1)}{" "}
                          MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 text-sm">Status History</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                        <FileVideo className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 text-xs">
                            Video Uploaded
                          </p>
                          <p className="text-xs text-blue-700">
                            {new Date(
                              currentVideo.uploadedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {currentVideo.approvedAt && (
                        <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900 text-xs">
                              Video Approved
                            </p>
                            <p className="text-xs text-green-700">
                              {new Date(
                                currentVideo.approvedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {currentVideo.rejectedAt && (
                        <div className="flex items-center space-x-3 p-2 bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900 text-xs">
                              Video Rejected
                            </p>
                            <p className="text-xs text-red-700">
                              {new Date(
                                currentVideo.rejectedAt
                              ).toLocaleDateString()}
                            </p>
                            {currentVideo.rejectionReason && (
                              <p className="text-xs text-red-800 mt-1 italic">
                                "{currentVideo.rejectionReason}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comments Section - Right Side */}
            <div className="xl:col-span-1">
              <Card className="h-full border-0 shadow-none">
                <CardContent className="p-0 h-full">
                  <VideoComments
                    videoId={currentVideo.id}
                    currentTime={currentTime}
                    onSeekTo={handleSeekTo}
                  />
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
