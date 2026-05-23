import { YouTubeThumbnailGenerator } from "@/components/youtube-thumbnail-generator";

export default function YouTubeThumbnailsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          YouTube-Style Thumbnail Generator
        </h1>
        <p className="text-muted-foreground">
          Create professional thumbnails like Thumbnail.AI with actual video
          frames and text overlays
        </p>
      </div>

      <YouTubeThumbnailGenerator />
    </div>
  );
}
