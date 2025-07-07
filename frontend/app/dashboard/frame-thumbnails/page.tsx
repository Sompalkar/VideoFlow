import { FrameThumbnailGenerator } from "@/components/frame-thumbnail-generator";

export default function FrameThumbnailsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Frame-Based Thumbnail Generator</h1>
        <p className="text-muted-foreground">
          Generate thumbnails from actual video frames with AI-powered text overlays
        </p>
      </div>
      
      <FrameThumbnailGenerator />
    </div>
  );
} 