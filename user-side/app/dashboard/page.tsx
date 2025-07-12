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
import { MainNav } from "@/components/main-nav";
import { DashboardNav } from "@/components/dashboard-nav";
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
    if (user) {
      fetchVideos();
      fetchAnalytics();

      // Show password change modal if user needs to change password
      if (user.needsPasswordChange) {
        setShowPasswordModal(true);
      }
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
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
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
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
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-50 to-green-50",
    },
    {
      title: "Pending Review",
      value: videos.filter((v) => v.status === "pending").length,
      change: 0,
      changeText: "awaiting approval",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
    },
    {
      title: "Total Views",
      value: analytics?.totalViews || 0,
      change: analytics?.viewsGrowth || 0,
      changeText: "vs last month",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      format: "number",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              Please log in to access dashboard
            </h1>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <MainNav />
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your videos today.
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <Link href="/dashboard/upload">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgColor} hover:shadow-xl transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.format === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      {stat.change > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                      ) : stat.change < 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                      ) : null}
                      <span
                        className={`text-sm ${
                          stat.change > 0
                            ? "text-green-600"
                            : stat.change < 0
                            ? "text-red-600"
                            : "text-gray-600"
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
                    className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Videos */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Video className="w-5 h-5 mr-2 text-indigo-600" />
                      Recent Videos
                    </CardTitle>
                    <CardDescription>
                      Your latest video uploads and their status
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/videos">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl bg-transparent"
                    >
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videosLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl animate-pulse"
                        >
                          <div className="w-20 h-12 bg-gray-200 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No videos yet
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Upload your first video to get started with VideoFlow
                      </p>
                      <Link href="/dashboard/upload">
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Your First Video
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    videos.slice(0, 5).map((video) => (
                      <div
                        key={video.id}
                        className="group flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-md hover:bg-white transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img
                              src={
                                video.cloudinaryThumbnailUrl ||
                                "/placeholder.svg?height=48&width=80"
                              }
                              alt={video.title}
                              className="w-20 h-12 object-cover rounded-lg shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {video.title}
                            </h3>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
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
                        <div className="flex items-center space-x-3">
                          <Badge
                            className={`${getStatusColor(
                              video.status
                            )} border rounded-full px-3 py-1`}
                          >
                            {getStatusIcon(video.status)}
                            <span className="ml-1 capitalize text-xs font-medium">
                              {video.status}
                            </span>
                          </Badge>
                          <Link href={`/dashboard/videos/${video.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/upload">
                  <Button className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl">
                    <Upload className="w-4 h-4 mr-3" />
                    Upload New Video
                  </Button>
                </Link>
                <Link href="/dashboard/team">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl bg-transparent"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Manage Team
                  </Button>
                </Link>
                <Link href="/dashboard/youtube">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl bg-transparent"
                  >
                    <Youtube className="w-4 h-4 mr-3" />
                    YouTube Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            {analytics && (
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Views</span>
                      </div>
                      <span className="font-semibold">
                        {analytics.totalViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Likes</span>
                      </div>
                      <span className="font-semibold">
                        {analytics.totalLikes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Comments</span>
                      </div>
                      <span className="font-semibold">
                        {analytics.totalComments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Avg. Watch Time
                      </span>
                      <span className="font-semibold">
                        {analytics.avgWatchTime}
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* YouTube Connection Status */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Youtube className="w-5 h-5 mr-2 text-red-600" />
                  YouTube Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.youtubeConnected ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Connected
                      </p>
                      <p className="text-xs text-gray-500">
                        Ready to publish videos
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Not Connected
                        </p>
                        <p className="text-xs text-gray-500">
                          Connect to publish videos
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/youtube">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl bg-transparent"
                      >
                        Connect YouTube
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
