"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Image, FileText, Palette, Target } from "lucide-react";
import { toast } from "sonner";

interface FrameThumbnail {
  url: string;
  publicId: string;
  style: string;
  frameInfo: {
    timestamp: number;
    objects: string[];
    colors: string[];
    quality: number;
  };
}

export function FrameThumbnailGenerator() {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnails, setThumbnails] = useState<FrameThumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFrameThumbnails = async () => {
    if (!videoUrl || !title) {
      toast.error("Please provide video URL and title");
      return;
    }

    setIsGenerating(true);
    setThumbnails([]);

    try {
      const response = await fetch("/api/frame-thumbnails/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          title,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setThumbnails(data.thumbnails);
        toast.success(
          `Generated ${data.thumbnails.length} frame-based thumbnails!`
        );
      } else {
        toast.error(data.message || "Failed to generate thumbnails");
      }
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      toast.error("Failed to generate thumbnails");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case "modern":
        return "bg-blue-500";
      case "bold":
        return "bg-red-500";
      case "minimal":
        return "bg-gray-500";
      case "dramatic":
        return "bg-purple-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Frame-Based Thumbnail Generator
          </CardTitle>
          <CardDescription>
            Generate thumbnails from actual video frames with text overlays
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              placeholder="https://res.cloudinary.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              placeholder="Enter video title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter video description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={generateFrameThumbnails}
            disabled={isGenerating || !videoUrl || !title}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Frame-Based Thumbnails...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Frame-Based Thumbnails
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {thumbnails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Thumbnails</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {thumbnails.map((thumbnail, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={thumbnail.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${getStyleColor(
                      thumbnail.style
                    )}`}
                  >
                    {thumbnail.style}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Quality: {thumbnail.frameInfo.quality}/100</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Play className="h-4 w-4" />
                    <span>Frame: {thumbnail.frameInfo.timestamp}s</span>
                  </div>

                  {thumbnail.frameInfo.objects.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Objects:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {thumbnail.frameInfo.objects.map((obj, objIndex) => (
                          <Badge
                            key={objIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {obj}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {thumbnail.frameInfo.colors.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Palette className="h-4 w-4" />
                        Colors:
                      </div>
                      <div className="flex gap-1">
                        {thumbnail.frameInfo.colors.map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
