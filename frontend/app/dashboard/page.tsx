"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { PasswordChangeModal } from "@/components/password-change-modal";
import {
  Play,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Youtube,
  Calendar,
  TrendingUp,
  Video,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  ThumbsUp,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { videos, fetchVideos, isLoading: videosLoading } = useVideoStore();
  const {
    analytics,
    fetchAnalytics,
    isLoading: analyticsLoading,
  } = useDashboardStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchVideos();
      fetchAnalytics();

      if (user.needsPasswordChange) {
        setShowPasswordModal(true);
      }
    }
  }, [user?.id, user?.needsPasswordChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-zinc-100 text-zinc-900 border-zinc-300";
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Youtube className="w-3 h-3" />;
      case "approved":
        return <CheckCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Video className="w-3 h-3" />;
    }
  };

  const stats = [
    {
      title: "Total Videos",
      value: videos.length,
      change: videos.filter(
        (v) =>
          new Date(v.uploadedAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      changeText: "this month",
      icon: Video,
      color: "bg-blue-600",
      bgColor: "bg-white",
    },
    {
      title: "Published",
      value: videos.filter((v) => v.status === "published").length,
      change: Math.round(
        (videos.filter((v) => v.status === "published").length /
          Math.max(videos.length, 1)) *
          100
      ),
      changeText: "of total",
      icon: Youtube,
      color: "bg-zinc-900",
      bgColor: "bg-white",
    },
    {
      title: "Pending Review",
      value: videos.filter((v) => v.status === "pending").length,
      change: 0,
      changeText: "awaiting approval",
      icon: Clock,
      color: "bg-zinc-600",
      bgColor: "bg-white",
    },
    {
      title: "Total Views",
      value: analytics?.totalViews || 0,
      change: analytics?.viewsGrowth || 0,
      changeText: "vs last month",
      icon: TrendingUp,
      color: "bg-blue-500",
      bgColor: "bg-white",
      format: "number",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Card className="w-full max-w-md shadow-sm border border-zinc-200 rounded-none">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-blue-600 flex items-center justify-center mx-auto mb-4 rounded-none">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold mb-4 tracking-tight">
              Access Restricted
            </h1>
            <Link href="/auth/login">
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-none w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider font-semibold">
                Overview of your workspace
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <Link href="/dashboard/upload">
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-none shadow-none text-white font-medium px-6">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`border border-zinc-200 shadow-sm rounded-none bg-white`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-zinc-950 tracking-tight">
                      {stat.format === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </p>
                    <div className="flex items-center mt-3">
                      {stat.change > 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-blue-600 mr-1" />
                      ) : stat.change < 0 ? (
                        <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          stat.change > 0
                            ? "text-blue-600"
                            : stat.change < 0
                            ? "text-red-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {stat.change > 0 ? "+" : ""}
                        {stat.change}
                        {stat.title === "Published" ? "%" : ""}{" "}
                        {stat.changeText}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 ${stat.color} rounded-none flex items-center justify-center`}
                  >
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Videos */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-zinc-200 rounded-none bg-white">
              <CardHeader className="pb-4 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center tracking-tight text-zinc-950">
                      Recent Videos
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Your latest uploads and their current status
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/videos">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {videosLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                         <div
                           key={i}
                           className="flex items-center space-x-4 p-4 bg-zinc-50 border border-zinc-100 animate-pulse"
                         >
                           <div className="w-20 h-12 bg-zinc-200" />
                           <div className="flex-1 space-y-2">
                             <div className="h-4 bg-zinc-200 w-3/4" />
                             <div className="h-3 bg-zinc-200 w-1/2" />
                           </div>
                         </div>
                      ))}
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-200">
                      <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-6 h-6 text-zinc-400" />
                      </div>
                      <h3 className="text-md font-semibold text-zinc-950 mb-1">
                        No videos found
                      </h3>
                      <p className="text-sm text-zinc-500 mb-6">
                        Upload a video to populate your dashboard
                      </p>
                      <Link href="/dashboard/upload">
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-none shadow-none">
                          Upload Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    videos.slice(0, 5).map((video) => (
                      <Link href={`/dashboard/videos/${video.id}`} key={video.id} className="block">
                        <div
                          className="group flex items-center justify-between p-3 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={
                                  video.cloudinaryThumbnailUrl ||
                                  "/placeholder.svg?height=48&width=80"
                                }
                                alt={video.title}
                                className="w-24 h-14 object-cover border border-zinc-200"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-zinc-950 truncate group-hover:text-blue-600 transition-colors">
                                {video.title}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-zinc-500">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(
                                    video.uploadedAt
                                  ).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>
                                  {Math.floor(video.duration / 60)}:
                                  {(video.duration % 60)
                                    .toString()
                                    .padStart(2, "0")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge
                              className={`${getStatusColor(
                                video.status
                              )} border rounded-none px-2 py-0.5 shadow-none`}
                            >
                              <span className="capitalize text-[10px] font-bold uppercase tracking-wider">
                                {video.status}
                              </span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-8 w-8 p-0 text-zinc-400 group-hover:text-blue-600 group-hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-sm border border-zinc-200 rounded-none bg-white">
              <CardHeader className="pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm tracking-widest uppercase font-semibold text-zinc-500">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 flex flex-col">
                <Link href="/dashboard/upload">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 rounded-none text-white font-medium shadow-none h-10">
                    <Upload className="w-4 h-4 mr-3" />
                    New Upload
                  </Button>
                </Link>
                <Link href="/dashboard/team">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-none border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 h-10"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Team
                  </Button>
                </Link>
                <Link href="/dashboard/youtube">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-none border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 h-10"
                  >
                    <Youtube className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            {analytics && (
              <Card className="shadow-sm border border-zinc-200 rounded-none bg-white">
                <CardHeader className="pb-3 border-b border-zinc-100">
                  <CardTitle className="text-sm tracking-widest uppercase font-semibold text-zinc-500">
                    Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-600">Views</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-950">
                        {analytics.totalViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-600">Likes</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-950">
                        {analytics.totalLikes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-600">Comments</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-950">
                        {analytics.totalComments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Avg. Watch
                      </span>
                      <span className="text-xs font-bold text-zinc-950">
                        {analytics.avgWatchTime}
                      </span>
                    </div>
                    <Progress value={75} className="h-1.5 rounded-none bg-zinc-100" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
