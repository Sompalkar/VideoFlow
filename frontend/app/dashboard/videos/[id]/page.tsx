"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useVideoStore } from "@/lib/stores/video-store"
import Link from "next/link"

export default function VideoReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { currentVideo, fetchVideoById, approveVideo, rejectVideo, isLoading, error, clearError } = useVideoStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null)

  const videoId = params.id as string

  useEffect(() => {
    if (videoId) {
      fetchVideoById(videoId)
    }
  }, [videoId])

  const handlePlayPause = () => {
    const video = document.getElementById("review-video") as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMuteToggle = () => {
    const video = document.getElementById("review-video") as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    const video = document.getElementById("review-video") as HTMLVideoElement
    if (video) {
      setCurrentTime(video.currentTime)
      setDuration(video.duration)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = document.getElementById("review-video") as HTMLVideoElement
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration

    if (video) {
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleApprove = async () => {
    if (!currentVideo) return

    setActionLoading("approve")
    clearError()

    try {
      await approveVideo(currentVideo.id)
      router.push("/dashboard?tab=videos")
    } catch (error) {
      console.error("Approve error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!currentVideo || !rejectionReason.trim()) return

    setActionLoading("reject")
    clearError()

    try {
      await rejectVideo(currentVideo.id, rejectionReason)
      setShowRejectDialog(false)
      setRejectionReason("")
      router.push("/dashboard?tab=videos")
    } catch (error) {
      console.error("Reject error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Youtube className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <FileVideo className="w-4 h-4" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to review videos</h1>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Video not found</h1>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard?tab=videos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Videos
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Video Review</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(currentVideo.status)}>
                {getStatusIcon(currentVideo.status)}
                <span className="ml-1 capitalize">{currentVideo.status}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative">
                  <video
                    id="review-video"
                    src={currentVideo.cloudinaryVideoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMuteToggle}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>

                      <div className="flex-1 flex items-center space-x-2">
                        <span className="text-white text-sm">{formatTime(currentTime)}</span>
                        <div className="flex-1 bg-white/30 rounded-full h-2 cursor-pointer" onClick={handleSeek}>
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentVideo.title}</h2>
                  <p className="text-gray-600 mb-4">{currentVideo.description}</p>

                  {currentVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentVideo.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-transparent">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons for Creators */}
                  {user.role === "creator" && currentVideo.status === "pending" && (
                    <div className="flex space-x-4 pt-4 border-t">
                      <Button
                        onClick={handleApprove}
                        disabled={actionLoading !== null}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        {actionLoading === "approve" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Publish to YouTube
                          </>
                        )}
                      </Button>

                      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Video
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Video</DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejecting this video. This will help the uploader understand
                              what needs to be improved.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Enter rejection reason..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleReject}
                              disabled={!rejectionReason.trim() || actionLoading !== null}
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
                    </div>
                  )}

                  {currentVideo.youtubeUrl && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href={currentVideo.youtubeUrl} target="_blank">
                        <Button className="bg-red-600 hover:bg-red-700">
                          <Youtube className="w-4 h-4 mr-2" />
                          View on YouTube
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Details Sidebar */}
          <div className="space-y-6">
            {/* Upload Information */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{currentVideo.uploadedBy.name}</p>
                    <p className="text-sm text-gray-500">{currentVideo.uploadedBy.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Uploaded</p>
                    <p className="text-sm text-gray-500">
                      {new Date(currentVideo.uploadedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-gray-500">{formatTime(currentVideo.duration)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileVideo className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">File Size</p>
                    <p className="text-sm text-gray-500">{(currentVideo.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <FileVideo className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Video Uploaded</p>
                      <p className="text-sm text-blue-700">{new Date(currentVideo.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {currentVideo.approvedAt && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">Video Approved</p>
                        <p className="text-sm text-green-700">
                          {new Date(currentVideo.approvedAt).toLocaleDateString()}
                        </p>
                        {currentVideo.approvedBy && (
                          <p className="text-sm text-green-600">by {currentVideo.approvedBy.name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentVideo.rejectedAt && (
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">Video Rejected</p>
                        <p className="text-sm text-red-700">{new Date(currentVideo.rejectedAt).toLocaleDateString()}</p>
                        {currentVideo.rejectedBy && (
                          <p className="text-sm text-red-600">by {currentVideo.rejectedBy.name}</p>
                        )}
                        {currentVideo.rejectionReason && (
                          <p className="text-sm text-red-800 mt-1 italic">"{currentVideo.rejectionReason}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentVideo.status === "published" && currentVideo.youtubeUrl && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Youtube className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-900">Published to YouTube</p>
                        <p className="text-sm text-purple-700">
                          {currentVideo.approvedAt && new Date(currentVideo.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
