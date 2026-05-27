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
    if (user?.id) {
      checkYouTubeStatus();
    }
  }, [user?.id]);

  const checkYouTubeStatus = async () => {
    try {
      const response = await apiClient.get<YouTubeStatus>("/youtube/status", undefined, { withCredentials: true });
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
      const response = await apiClient.get<{ channel: ChannelInfo }>("/youtube/channel", undefined, { withCredentials: true });
      setChannelInfo(response.channel);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch channel info");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChannelInfo = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ channel: ChannelInfo }>("/youtube/refresh-channel", {}, undefined, { withCredentials: true });
      setChannelInfo(response.channel);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to refresh channel info");
    } finally {
      setIsLoading(false);
    }
  };

  const connectYouTube = async () => {
    setIsConnecting(true);
    setError("");
    try {
      const response = await apiClient.get<{ authUrl: string }>("/youtube/auth-url", undefined, { withCredentials: true });
      window.location.href = response.authUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to connect YouTube");
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete("/youtube/disconnect", undefined, { withCredentials: true });
      setChannelInfo(null);
      setYoutubeStatus({ connected: false, channelId: null, channelName: null });
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to disconnect YouTube");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Please log in to access YouTube settings</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-zinc-200 pb-6">
          <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">YouTube Integration</h1>
          <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider font-semibold">
            Manage your YouTube channel connection
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-none border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Connection Status */}
            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-bold flex items-center space-x-2 text-zinc-900">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <span>Connection Status</span>
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Your YouTube channel connection and authentication status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {youtubeStatus.connected ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-zinc-900" />
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">Connected</p>
                          <p className="text-xs text-zinc-500">Your YouTube channel is ready</p>
                        </div>
                      </div>
                      <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-none shadow-none">Active</Badge>
                    </div>

                    {channelInfo && (
                      <div className="p-4 border border-zinc-200 bg-white">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-16 h-16 rounded-none border border-zinc-200">
                            <AvatarImage src={channelInfo.thumbnail} alt={channelInfo.title} className="rounded-none object-cover" />
                            <AvatarFallback className="rounded-none bg-zinc-100 text-zinc-500">{channelInfo.title.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900">{channelInfo.title}</h3>
                            <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{channelInfo.description}</p>
                            <div className="flex items-center space-x-4 mt-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                              <span className="flex items-center">
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                {Number.parseInt(channelInfo.subscriberCount).toLocaleString()} subs
                              </span>
                              <span className="flex items-center">
                                <Video className="w-3.5 h-3.5 mr-1.5" />
                                {Number.parseInt(channelInfo.videoCount).toLocaleString()} videos
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button onClick={refreshChannelInfo} disabled={isLoading} variant="outline" className="rounded-none border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:text-zinc-900">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                      </Button>
                      <Button onClick={disconnectYouTube} disabled={isLoading} variant="outline" className="rounded-none border-red-200 text-red-600 bg-white hover:bg-red-50">
                        <Unlink className="w-4 h-4 mr-2" /> Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center mx-auto mb-4 rounded-full">
                      <Youtube className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">Connect Your Channel</h3>
                    <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                      Link your YouTube account to publish approved videos directly from the dashboard.
                    </p>
                    <Button onClick={connectYouTube} disabled={isConnecting} className="bg-red-600 hover:bg-red-700 text-white rounded-none shadow-none px-8">
                      {isConnecting ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                      ) : (
                        <><Youtube className="w-4 h-4 mr-2" /> Connect YouTube</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel Analytics */}
            {youtubeStatus.connected && channelInfo && (
              <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
                <CardHeader className="border-b border-zinc-100 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center space-x-2 text-zinc-900">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Channel Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-zinc-200 bg-zinc-50">
                      <div className="flex items-center space-x-2 mb-2 text-zinc-500 uppercase tracking-wider text-xs font-bold">
                        <Eye className="w-4 h-4" /> <span>Views</span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">{Number.parseInt(channelInfo.viewCount).toLocaleString()}</p>
                    </div>
                    <div className="p-4 border border-zinc-200 bg-zinc-50">
                      <div className="flex items-center space-x-2 mb-2 text-zinc-500 uppercase tracking-wider text-xs font-bold">
                        <Users className="w-4 h-4" /> <span>Subscribers</span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">{Number.parseInt(channelInfo.subscriberCount).toLocaleString()}</p>
                    </div>
                    <div className="p-4 border border-zinc-200 bg-zinc-50">
                      <div className="flex items-center space-x-2 mb-2 text-zinc-500 uppercase tracking-wider text-xs font-bold">
                        <Video className="w-4 h-4" /> <span>Videos</span>
                      </div>
                      <p className="text-2xl font-bold text-zinc-900">{Number.parseInt(channelInfo.videoCount).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm tracking-widest uppercase font-semibold text-zinc-500">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600">Videos published</span>
                  <span className="font-bold text-zinc-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600">Pending approval</span>
                  <span className="font-bold text-zinc-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600">This month</span>
                  <span className="font-bold text-zinc-900">8</span>
                </div>
                <Separator className="bg-zinc-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600">Success rate</span>
                  <span className="font-bold text-blue-600">98%</span>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm tracking-widest uppercase font-semibold text-zinc-500">Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <Button variant="outline" className="w-full justify-start rounded-none border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 h-10">
                  <ExternalLink className="w-4 h-4 mr-3" /> YouTube API Docs
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-none border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 h-10">
                  <MessageSquare className="w-4 h-4 mr-3" /> Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-none border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 h-10">
                  <Settings className="w-4 h-4 mr-3" /> Troubleshooting
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-none shadow-none border border-zinc-200 bg-white">
              <CardHeader className="pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm tracking-widest uppercase font-semibold text-zinc-500">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 shrink-0" />
                    <span className="text-sm text-zinc-700 font-medium">Video published successfully</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-zinc-900 shrink-0" />
                    <span className="text-sm text-zinc-700 font-medium">Channel info updated</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-zinc-400 shrink-0" />
                    <span className="text-sm text-zinc-700 font-medium">Pending video approval</span>
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
