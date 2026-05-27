"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  Upload,
  Video,
  Search,
  MoreHorizontal,
  Play,
  Youtube,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  FileVideo,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useVideoStore } from "@/lib/stores/video-store"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function VideosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { videos, fetchVideos, isLoading, error } = useVideoStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    if (user?.id) {
      fetchVideos()
    }
  }, [user?.id])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setSelectedTab(tab)
    }
  }, [searchParams])

  const filteredVideos = videos
    .filter((video) => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "pending" && video.status === "pending") ||
        (selectedTab === "approved" && video.status === "approved") ||
        (selectedTab === "published" && video.status === "published") ||
        (selectedTab === "rejected" && video.status === "rejected")

      return matchesSearch && matchesTab
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-zinc-100 text-zinc-900 border-zinc-300"
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
      case "uploading":
        return "bg-purple-50 text-purple-700 border-purple-200"
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <Youtube className="w-3 h-3" />
      case "approved": return <CheckCircle className="w-3 h-3" />
      case "pending": return <Clock className="w-3 h-3" />
      case "rejected": return <XCircle className="w-3 h-3" />
      case "uploading": return <Upload className="w-3 h-3" />
      default: return <Video className="w-3 h-3" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getVideoStats = () => {
    const stats = {
      total: videos.length,
      pending: videos.filter((v) => v.status === "pending").length,
      approved: videos.filter((v) => v.status === "approved").length,
      published: videos.filter((v) => v.status === "published").length,
      rejected: videos.filter((v) => v.status === "rejected").length,
    }
    return stats
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center p-8 bg-white rounded-none border border-zinc-200">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-6 h-6 text-zinc-600" />
          </div>
          <h1 className="text-xl font-bold mb-3 text-zinc-900 tracking-tight">
            Please log in to access videos
          </h1>
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stats = getVideoStats()

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">All Videos</h1>
            <p className="text-zinc-500 mt-1 text-sm uppercase tracking-wider font-semibold">{stats.total} total videos</p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-none h-10 px-6 font-bold">
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 rounded-none text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards - Minimalist */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
             { label: "Total", value: stats.total, icon: Video, color: "text-zinc-900" },
             { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600" },
             { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-blue-600" },
             { label: "Published", value: stats.published, icon: Youtube, color: "text-zinc-600" },
             { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white border-zinc-200 rounded-none shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
                <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simplified Tabs & Search */}
        <div className="bg-white border border-zinc-200 p-2 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex space-x-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
             {[
               { id: "all", label: "All Videos" },
               { id: "pending", label: `Pending (${stats.pending})` },
               { id: "approved", label: `Approved (${stats.approved})` },
               { id: "published", label: `Published (${stats.published})` },
               { id: "rejected", label: `Rejected (${stats.rejected})` }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setSelectedTab(tab.id)}
                 className={cn(
                   "px-4 py-2 text-sm font-bold tracking-wider uppercase whitespace-nowrap transition-colors",
                   selectedTab === tab.id
                     ? "bg-zinc-100 text-zinc-900"
                     : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                 )}
               >
                 {tab.label}
               </button>
             ))}
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-none border-zinc-300 focus-visible:ring-blue-600 bg-zinc-50 h-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading videos...</p>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className="rounded-none border-zinc-200 shadow-none hover:border-blue-400 transition-colors cursor-pointer group bg-white flex flex-col"
                  onClick={() => router.push(`/dashboard/videos/${video.id}`)}
                >
                  <div className="aspect-video bg-zinc-100 relative overflow-hidden border-b border-zinc-100">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={cn("text-[10px] font-bold uppercase tracking-wider rounded-none px-2 py-0.5 shadow-none border", getStatusColor(video.status))}>
                        {getStatusIcon(video.status)}
                        <span className="ml-1">{video.status}</span>
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 tracking-wider">
                      {formatDuration(video.duration)}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                       <div className="w-10 h-10 bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                        <Play className="w-4 h-4 text-blue-600 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm font-bold text-zinc-900 line-clamp-2 leading-tight">
                        {video.title}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 text-zinc-400 hover:text-zinc-900 rounded-none">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-zinc-200 rounded-none shadow-sm">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/videos/${video.id}`); }} className="font-semibold text-xs uppercase tracking-wider focus:bg-zinc-50 cursor-pointer">
                            <Eye className="w-3.5 h-3.5 mr-2" /> View & Review
                          </DropdownMenuItem>
                          {user?.role === "creator" && video.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="font-semibold text-xs uppercase tracking-wider focus:bg-blue-50 text-blue-600 cursor-pointer">
                                <CheckCircle className="w-3.5 h-3.5 mr-2" /> Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="font-semibold text-xs uppercase tracking-wider focus:bg-red-50 text-red-600 cursor-pointer">
                                <XCircle className="w-3.5 h-3.5 mr-2" /> Quick Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 mt-auto">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1.5" />
                        <span className="truncate max-w-[80px]">{video.uploadedBy.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {new Date(video.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed border-zinc-300">
                <div className="w-16 h-16 bg-zinc-50 flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                  <FileVideo className="w-6 h-6 text-zinc-300" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-zinc-900 tracking-tight">No videos found</h3>
                <p className="text-zinc-500 mb-6 max-w-sm mx-auto text-sm">
                  {searchTerm
                    ? "Try adjusting your search to find what you're looking for."
                    : "Upload your first video to get started with your library."}
                </p>
                <Link href="/dashboard/upload">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold">
                    <Upload className="w-4 h-4 mr-2" /> Upload Video
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
