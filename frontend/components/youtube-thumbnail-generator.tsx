"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Play,
  Image,
  FileText,
  Palette,
  Target,
  Sparkles,
  Download,
  Eye,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface ThumbnailStyle {
  name: string;
  description: string;
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  effects: string[];
  position: "top" | "center" | "bottom";
  shadow: boolean;
  glow: boolean;
  border?: boolean;
  borderColor?: string;
}

interface GeneratedThumbnail {
  id: string;
  url: string;
  publicId: string;
  style: string;
  aspectRatio: string;
  quality: string;
  frameInfo?: {
    timestamp: number;
    quality: number;
    objects: string[];
  };
  metadata: {
    title: string;
    subtitle?: string;
    platform: string;
    generatedAt: Date;
  };
}

interface ThumbnailOptions {
  baseImage?: string;
  videoUrl?: string;
  title: string;
  subtitle?: string;
  style: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  quality: "low" | "medium" | "high";
  variations: number;
  platform: "youtube" | "instagram" | "facebook" | "tiktok";
  customColors?: {
    textColor?: string;
    backgroundColor?: string;
    accentColor?: string;
  };
  effects?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

export function YouTubeThumbnailGenerator() {
  const [options, setOptions] = useState<ThumbnailOptions>({
    title: "",
    subtitle: "",
    style: "cool-energy",
    aspectRatio: "16:9",
    quality: "medium",
    variations: 4,
    platform: "youtube",
  });

  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableStyles, setAvailableStyles] = useState<ThumbnailStyle[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] =
    useState<GeneratedThumbnail | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load available styles on component mount
  useEffect(() => {
    loadAvailableStyles();
  }, []);

  const loadAvailableStyles = async () => {
    try {
      const response = await fetch("/api/youtube-thumbnails/styles");
      const data = await response.json();

      if (data.success) {
        setAvailableStyles(data.styles);
      }
    } catch (error) {
      console.error("Failed to load styles:", error);
    }
  };

  const generateThumbnails = async () => {
    if (!options.title) {
      toast.error("Please enter a title");
      return;
    }

    if (!options.baseImage && !options.videoUrl) {
      toast.error("Please provide either a base image or video URL");
      return;
    }

    setIsGenerating(true);
    setThumbnails([]);

    try {
      const response = await fetch("/api/youtube-thumbnails/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (data.success) {
        setThumbnails(data.thumbnails);
        toast.success(`Generated ${data.thumbnails.length} thumbnails!`);
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

  const handleDownload = (thumbnail: GeneratedThumbnail) => {
    const link = document.createElement("a");
    link.href = thumbnail.url;
    link.download = `thumbnail-${thumbnail.style}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Thumbnail downloaded!");
  };

  const getStyleColor = (style: string) => {
    const styleMap: Record<string, string> = {
      "cool-energy": "bg-orange-500",
      "professional-impact": "bg-blue-500",
      "high-energy": "bg-red-500",
      minimalist: "bg-gray-500",
      cinematic: "bg-yellow-500",
      "face-reaction": "bg-pink-500",
      "bold-overlay": "bg-purple-500",
      "viral-kids": "bg-green-500",
    };
    return styleMap[style] || "bg-blue-500";
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "🎥";
      case "instagram":
        return "📸";
      case "facebook":
        return "📘";
      case "tiktok":
        return "🎵";
      default:
        return "📱";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            YouTube-Style Thumbnail Generator
          </CardTitle>
          <CardDescription>
            Create professional thumbnails like Thumbnail.AI with actual video
            frames and text overlays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your video title..."
                    value={options.title}
                    onChange={(e) =>
                      setOptions({ ...options, title: e.target.value })
                    }
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    {options.title.length}/100 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    placeholder="Enter subtitle..."
                    value={options.subtitle}
                    onChange={(e) =>
                      setOptions({ ...options, subtitle: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Base Image Source</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseImage">Upload Image URL</Label>
                      <Input
                        id="baseImage"
                        placeholder="https://example.com/image.jpg"
                        value={options.baseImage || ""}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            baseImage: e.target.value,
                            videoUrl: undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">
                        Video URL (for frame extraction)
                      </Label>
                      <Input
                        id="videoUrl"
                        placeholder="https://cloudinary.com/video.mp4"
                        value={options.videoUrl || ""}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            videoUrl: e.target.value,
                            baseImage: undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose Thumbnail Style</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {availableStyles.map((style) => (
                      <Card
                        key={style.name}
                        className={`cursor-pointer transition-all ${
                          options.style ===
                          style.name.toLowerCase().replace(/\s+/g, "-")
                            ? "ring-2 ring-blue-500"
                            : "hover:ring-1 hover:ring-gray-300"
                        }`}
                        onClick={() =>
                          setOptions({
                            ...options,
                            style: style.name
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          })
                        }
                      >
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{style.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {style.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {style.effects.map((effect) => (
                              <Badge
                                key={effect}
                                variant="outline"
                                className="text-xs"
                              >
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={options.aspectRatio}
                      onValueChange={(value: "16:9" | "9:16" | "1:1") =>
                        setOptions({ ...options, aspectRatio: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select
                      value={options.platform}
                      onValueChange={(
                        value: "youtube" | "instagram" | "facebook" | "tiktok"
                      ) => setOptions({ ...options, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={options.quality}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setOptions({ ...options, quality: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">
                          Medium (Balanced)
                        </SelectItem>
                        <SelectItem value="high">
                          High (Best Quality)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Variations</Label>
                    <Select
                      value={options.variations.toString()}
                      onValueChange={(value) =>
                        setOptions({ ...options, variations: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 (Faster)</SelectItem>
                        <SelectItem value="4">4 (Balanced)</SelectItem>
                        <SelectItem value="6">6 (More Options)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Image Effects</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brightness</Label>
                      <Slider
                        value={[options.effects?.brightness || 0]}
                        onValueChange={([value]) =>
                          setOptions({
                            ...options,
                            effects: { ...options.effects, brightness: value },
                          })
                        }
                        max={100}
                        min={-100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contrast</Label>
                      <Slider
                        value={[options.effects?.contrast || 0]}
                        onValueChange={([value]) =>
                          setOptions({
                            ...options,
                            effects: { ...options.effects, contrast: value },
                          })
                        }
                        max={100}
                        min={-100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Saturation</Label>
                      <Slider
                        value={[options.effects?.saturation || 0]}
                        onValueChange={([value]) =>
                          setOptions({
                            ...options,
                            effects: { ...options.effects, saturation: value },
                          })
                        }
                        max={100}
                        min={-100}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Review your settings and click generate to create your
                    thumbnails
                  </p>

                  <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span>Title:</span>
                      <span className="font-medium">
                        {options.title || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Style:</span>
                      <span className="font-medium">{options.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aspect Ratio:</span>
                      <span className="font-medium">{options.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-medium">
                        {getPlatformIcon(options.platform)} {options.platform}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variations:</span>
                      <span className="font-medium">{options.variations}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={generateThumbnails}
                  disabled={isGenerating || !options.title}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Thumbnails...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Thumbnails
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {thumbnails.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Thumbnails</h3>
            <Badge variant="outline">{thumbnails.length} variations</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {thumbnails.map((thumbnail) => (
              <Card key={thumbnail.id} className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={thumbnail.url}
                    alt={`Thumbnail - ${thumbnail.style}`}
                    className="w-full h-48 object-cover"
                  />

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedThumbnail(thumbnail)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(thumbnail)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Badge
                    className={`absolute top-2 right-2 ${getStyleColor(
                      thumbnail.style
                    )}`}
                  >
                    {thumbnail.style}
                  </Badge>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quality:</span>
                    <Badge variant="outline" className="text-xs">
                      {thumbnail.quality}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aspect:</span>
                    <Badge variant="outline" className="text-xs">
                      {thumbnail.aspectRatio}
                    </Badge>
                  </div>

                  {thumbnail.frameInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>
                          Frame Quality: {thumbnail.frameInfo.quality}/100
                        </span>
                      </div>

                      {thumbnail.frameInfo.objects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {thumbnail.frameInfo.objects
                            .slice(0, 3)
                            .map((obj, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {obj}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedThumbnail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thumbnail Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedThumbnail(null)}
              >
                ×
              </Button>
            </div>

            <img
              src={selectedThumbnail.url}
              alt="Thumbnail preview"
              className="w-full rounded-lg"
            />

            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleDownload(selectedThumbnail)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedThumbnail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
