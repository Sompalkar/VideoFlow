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
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { videos, fetchVideos, isLoading: videosLoading } = useVideoStore();
  const {
    analytics,
    fetchAnalytics,
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
        return "bg-teal-700/10 text-teal-800 border-teal-700/20";
      case "approved":
        return "bg-teal-500/10 text-teal-700 border-teal-500/20";
      case "pending":
        return "bg-yellow-400/20 text-yellow-700 border-yellow-500/30";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-stone-100 text-stone-600 border-stone-200";
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
      tile: "bg-teal-700",
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
      tile: "bg-stone-900",
    },
    {
      title: "Pending Review",
      value: videos.filter((v) => v.status === "pending").length,
      change: 0,
      changeText: "awaiting approval",
      icon: Clock,
      tile: "bg-yellow-400 text-stone-900",
    },
    {
      title: "Total Views",
      value: analytics?.totalViews || 0,
      change: analytics?.viewsGrowth || 0,
      changeText: "vs last month",
      icon: TrendingUp,
      tile: "bg-teal-600",
      format: "number",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
        <Card className="w-full max-w-md shadow-sm border border-stone-900/10 rounded-3xl bg-white">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-teal-700 flex items-center justify-center mx-auto mb-4 rounded-2xl">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold mb-4 tracking-tight text-stone-900">
              Access Restricted
            </h1>
            <Link href="/auth/login">
              <Button className="bg-teal-700 hover:bg-teal-800 rounded-full w-full text-white">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-stone-900/10 pb-6">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-teal-700 mb-2">
                Overview
              </p>
              <h1 className="font-display text-4xl font-semibold text-stone-900 tracking-tight">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
            </div>
            <Link href="/dashboard/upload">
              <Button className="group bg-teal-700 hover:bg-teal-800 rounded-full text-white font-semibold px-6 h-11 shadow-lg shadow-teal-900/15 transition-all hover:-translate-y-0.5">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border border-stone-900/8 shadow-sm rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/5"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      {stat.title}
                    </p>
                    <p className="font-display text-3xl font-semibold text-stone-900 tracking-tight">
                      {stat.format === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </p>
                    <div className="flex items-center mt-3">
                      {stat.change > 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-teal-700 mr-1" />
                      ) : stat.change < 0 ? (
                        <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          stat.change > 0
                            ? "text-teal-700"
                            : stat.change < 0
                            ? "text-red-600"
                            : "text-stone-500"
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
                    className={`w-11 h-11 ${stat.tile} rounded-2xl flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Videos */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-stone-900/8 rounded-2xl bg-white">
              <CardHeader className="pb-4 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-xl flex items-center tracking-tight text-stone-900">
                      Recent Videos
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 text-stone-500">
                      Your latest uploads and their current status
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/videos">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-stone-300 text-stone-700 hover:bg-stone-50"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {videosLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-4 p-4 bg-[#FAF6EE] border border-stone-100 rounded-2xl animate-pulse"
                        >
                          <div className="w-24 h-14 bg-stone-200 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-stone-200 w-3/4 rounded-full" />
                            <div className="h-3 bg-stone-200 w-1/2 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-stone-300 rounded-2xl bg-[#FAF6EE]">
                      <div className="w-12 h-12 bg-teal-700/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Video className="w-6 h-6 text-teal-700" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-stone-900 mb-1">
                        No videos found
                      </h3>
                      <p className="text-sm text-stone-500 mb-6">
                        Upload a video to populate your dashboard
                      </p>
                      <Link href="/dashboard/upload">
                        <Button className="bg-teal-700 hover:bg-teal-800 rounded-full text-white">
                          Upload Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    videos.slice(0, 5).map((video) => (
                      <Link href={`/dashboard/videos/${video.id}`} key={video.id} className="block">
                        <div className="group flex items-center justify-between p-3 bg-white border border-stone-200 rounded-2xl hover:border-teal-300 hover:bg-teal-700/[0.03] transition-colors cursor-pointer">
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={
                                  video.cloudinaryThumbnailUrl ||
                                  "/placeholder.svg?height=48&width=80"
                                }
                                alt={video.title}
                                className="w-24 h-14 object-cover rounded-xl border border-stone-200"
                              />
                              <div className="absolute inset-0 bg-stone-900/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-stone-900 truncate group-hover:text-teal-700 transition-colors">
                                {video.title}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-stone-500">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(video.uploadedAt).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>
                                  {Math.floor(video.duration / 60)}:
                                  {(video.duration % 60).toString().padStart(2, "0")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0 pl-3">
                            <Badge
                              className={`${getStatusColor(
                                video.status
                              )} border rounded-full px-2.5 py-0.5 shadow-none gap-1 hidden sm:inline-flex`}
                            >
                              {getStatusIcon(video.status)}
                              <span className="capitalize text-[10px] font-bold uppercase tracking-wider">
                                {video.status}
                              </span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-8 w-8 p-0 text-stone-400 group-hover:text-teal-700 group-hover:bg-teal-700/10"
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
            <Card className="shadow-sm border border-stone-900/8 rounded-2xl bg-white">
              <CardHeader className="pb-3 border-b border-stone-100">
                <CardTitle className="text-xs tracking-widest uppercase font-semibold text-stone-500">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 flex flex-col">
                <Link href="/dashboard/upload">
                  <Button className="w-full justify-start bg-teal-700 hover:bg-teal-800 rounded-xl text-white font-medium h-11">
                    <Upload className="w-4 h-4 mr-3" />
                    New Upload
                  </Button>
                </Link>
                <Link href="/dashboard/team">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 h-11"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Team
                  </Button>
                </Link>
                <Link href="/dashboard/youtube">
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 h-11"
                  >
                    <Youtube className="w-4 h-4 mr-3" />
                    YouTube
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            {analytics && (
              <Card className="shadow-sm border border-stone-900/8 rounded-2xl bg-white">
                <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-xs tracking-widest uppercase font-semibold text-stone-500">
                    Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-teal-700" />
                        <span className="text-sm text-stone-600">Views</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-900">
                        {analytics.totalViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-teal-700" />
                        <span className="text-sm text-stone-600">Likes</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-900">
                        {analytics.totalLikes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-teal-700" />
                        <span className="text-sm text-stone-600">Comments</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-900">
                        {analytics.totalComments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        Avg. Watch
                      </span>
                      <span className="text-xs font-bold text-stone-900">
                        {analytics.avgWatchTime}
                      </span>
                    </div>
                    <Progress value={75} className="h-1.5 rounded-full bg-stone-100 [&>div]:bg-teal-700" />
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
