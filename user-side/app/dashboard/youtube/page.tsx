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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "@/components/main-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Youtube,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Eye,
  MessageSquare,
  Settings,
  Unlink,
  RefreshCw,
  TrendingUp,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiClient } from "@/lib/config/api";

interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface YouTubeStatus {
  connected: boolean;
  channelId: string | null;
  channelName: string | null;
}

export default function YouTubePage() {
  const { user } = useAuthStore();
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>({
    connected: false,
    channelId: null,
    channelName: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      checkYouTubeStatus();
    }
  }, [user]);

  const checkYouTubeStatus = async () => {
    try {
      const response = await apiClient.get<YouTubeStatus>(
        "/youtube/status",
        undefined,
        { withCredentials: true }
      );
      setYoutubeStatus(response);

      if (response.connected) {
        fetchChannelInfo();
      }
    } catch (error) {
      console.error("Failed to check YouTube status:", error);
    }
  };

  const fetchChannelInfo = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ channel: ChannelInfo }>(
        "/youtube/channel",
        undefined,
        { withCredentials: true }
      );
      setChannelInfo(response.channel);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch channel info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChannelInfo = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ channel: ChannelInfo }>(
        "/youtube/refresh-channel",
        {},
        undefined,
        { withCredentials: true }
      );
      setChannelInfo(response.channel);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to refresh channel info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const connectYouTube = async () => {
    setIsConnecting(true);
    setError("");

    try {
      const response = await apiClient.get<{ authUrl: string }>(
        "/youtube/auth-url",
        undefined,
        { withCredentials: true }
      );
      window.location.href = response.authUrl;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to connect YouTube"
      );
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete("/youtube/disconnect", undefined, {
        withCredentials: true,
      });
      setChannelInfo(null);
      setYoutubeStatus({
        connected: false,
        channelId: null,
        channelName: null,
      });
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to disconnect YouTube"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Please log in to access YouTube settings
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <MainNav />
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              YouTube Integration
            </h1>
          </div>
          <p className="text-gray-600">
            Manage your YouTube channel connection and publishing settings
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Status */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <span>Connection Status</span>
                </CardTitle>
                <CardDescription>
                  Your YouTube channel connection and authentication status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {youtubeStatus.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">
                            Connected
                          </p>
                          <p className="text-sm text-green-700">
                            Your YouTube channel is connected and ready
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    </div>

                    {channelInfo && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage
                              src={channelInfo.thumbnail || "/placeholder.svg"}
                              alt={channelInfo.title}
                            />
                            <AvatarFallback>
                              {channelInfo.title.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {channelInfo.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {channelInfo.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {Number.parseInt(
                                  channelInfo.subscriberCount
                                ).toLocaleString()}{" "}
                                subscribers
                              </span>
                              <span className="flex items-center">
                                <Video className="w-4 h-4 mr-1" />
                                {Number.parseInt(
                                  channelInfo.videoCount
                                ).toLocaleString()}{" "}
                                videos
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        onClick={refreshChannelInfo}
                        disabled={isLoading}
                        variant="outline"
                        className="rounded-xl bg-transparent"
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${
                            isLoading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh Info
                      </Button>
                      <Button
                        onClick={disconnectYouTube}
                        disabled={isLoading}
                        variant="outline"
                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Youtube className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Connect Your YouTube Channel
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Connect your YouTube channel to automatically publish
                      approved videos and manage your content.
                    </p>
                    <Button
                      onClick={connectYouTube}
                      disabled={isConnecting}
                      className="bg-red-600 hover:bg-red-700 rounded-xl"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4 h-4 mr-2" />
                          Connect YouTube
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel Analytics */}
            {youtubeStatus.connected && channelInfo && (
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span>Channel Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Overview of your YouTube channel performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">
                        {Number.parseInt(
                          channelInfo.viewCount
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700">Total Views</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-900">
                        {Number.parseInt(
                          channelInfo.subscriberCount
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-700">Subscribers</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-900">
                        {Number.parseInt(
                          channelInfo.videoCount
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-purple-700">Videos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Videos published
                  </span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Pending approval
                  </span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This month</span>
                  <span className="font-semibold">8</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success rate</span>
                  <span className="font-semibold text-green-600">98%</span>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg">Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl bg-transparent"
                >
                  <ExternalLink className="w-4 h-4 mr-3" />
                  YouTube API Docs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl bg-transparent"
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl bg-transparent"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Troubleshooting
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-600">
                      Video published successfully
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-600">Channel info updated</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-gray-600">
                      Pending video approval
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
