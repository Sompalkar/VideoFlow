import { create } from "zustand";
import { apiClient } from "@/lib/config/api";

interface ThumbnailStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface GeneratedThumbnail {
  id: string;
  url: string;
  publicId: string;
  style: string;
  prompt: string;
  videoId?: string;
}

interface VideoAnalysis {
  dominantColors: string[];
  suggestedStyles: string[];
  recommendedText: string[];
}

interface Video {
  id: string;
  title: string;
  description: string;
  cloudinaryVideoUrl: string;
  cloudinaryThumbnailUrl: string;
  status: string;
}

interface AIThumbnailState {
  // State
  generatedThumbnails: GeneratedThumbnail[];
  selectedThumbnail: GeneratedThumbnail | null;
  availableStyles: ThumbnailStyle[];
  videoAnalysis: VideoAnalysis | null;
  uploadedVideos: Video[];
  selectedVideo: Video | null;
  isLoading: boolean;
  isGenerating: boolean;
  isEnhancing: boolean;
  isAnalyzing: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  generateThumbnails: (
    videoUrl: string,
    title: string,
    description: string,
    videoId?: string,
    options?: {
      style?: string;
      colors?: string[];
      text?: string;
      aspectRatio?: string;
    }
  ) => Promise<void>;

  enhanceThumbnail: (
    thumbnailUrl: string,
    enhancements: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      text?: string;
      overlay?: boolean;
    }
  ) => Promise<void>;

  analyzeVideo: (videoUrl: string) => Promise<void>;

  getThumbnailStyles: () => Promise<void>;

  fetchUploadedVideos: () => Promise<void>;

  selectVideo: (video: Video | null) => void;

  uploadVideoFile: (file: File) => Promise<{ videoUrl: string; title: string }>;

  selectThumbnail: (thumbnail: GeneratedThumbnail) => void;

  clearThumbnails: () => void;

  clearError: () => void;

  // Frame extraction and AI enhancement
  enhanceFrameWithAI: (
    frameUrl: string,
    prompt: string,
    options?: any
  ) => Promise<GeneratedThumbnail | null>;

  applyOverlay: (
    publicId: string,
    overlayOptions: any
  ) => Promise<string | null>;

  fallbackTextToImage: (
    prompt: string,
    options?: any
  ) => Promise<{ url: string; publicId: string } | null>;
}

export const useAIThumbnailStore = create<AIThumbnailState>((set, get) => ({
  // Initial state
  generatedThumbnails: [],
  selectedThumbnail: null,
  availableStyles: [],
  videoAnalysis: null,
  uploadedVideos: [],
  selectedVideo: null,
  isLoading: false,
  isGenerating: false,
  isEnhancing: false,
  isAnalyzing: false,
  isUploading: false,
  error: null,

  // Generate thumbnails
  generateThumbnails: async (
    videoUrl,
    title,
    description,
    videoId,
    options = {}
  ) => {
    try {
      set({ isGenerating: true, error: null });

      const requestData = {
        videoUrl,
        title,
        description,
        videoId,
        ...options,
      };

      /* console log removed */
      /* console log removed */

      const response = await apiClient.post<{
        success: boolean;
        thumbnails: GeneratedThumbnail[];
        message: string;
      }>("/ai-thumbnails/generate", requestData, undefined, {
        withCredentials: true,
      });

      if (response.success) {
        set({
          generatedThumbnails: response.thumbnails,
          isGenerating: false,
        });
        /* console log removed */
      } else {
        throw new Error(response.message || "Failed to generate thumbnails");
      }
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate thumbnails",
        isGenerating: false,
      });
    }
  },

  // Enhance thumbnail
  enhanceThumbnail: async (thumbnailUrl, enhancements) => {
    try {
      set({ isEnhancing: true, error: null });

      /* console log removed */

      const response = await apiClient.post<{
        success: boolean;
        thumbnail: { url: string; publicId: string };
        message: string;
      }>(
        "/ai-thumbnails/enhance",
        {
          thumbnailUrl,
          ...enhancements,
        },
        undefined,
        { withCredentials: true }
      );

      if (response.success) {
        // Update the selected thumbnail with enhanced version
        const { selectedThumbnail } = get();
        if (selectedThumbnail) {
          const enhancedThumbnail: GeneratedThumbnail = {
            ...selectedThumbnail,
            url: response.thumbnail.url,
            publicId: response.thumbnail.publicId,
          };
          set({
            selectedThumbnail: enhancedThumbnail,
            isEnhancing: false,
          });
        }
        /* console log removed */
      } else {
        throw new Error(response.message || "Failed to enhance thumbnail");
      }
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to enhance thumbnail",
        isEnhancing: false,
      });
    }
  },

  // Analyze video
  analyzeVideo: async (videoUrl) => {
    try {
      set({ isAnalyzing: true, error: null });

      /* console log removed */

      const response = await apiClient.post<{
        success: boolean;
        analysis: VideoAnalysis;
        message: string;
      }>("/ai-thumbnails/analyze", { videoUrl }, undefined, {
        withCredentials: true,
      });

      if (response.success) {
        set({
          videoAnalysis: response.analysis,
          isAnalyzing: false,
        });
        /* console log removed */
      } else {
        throw new Error(response.message || "Failed to analyze video");
      }
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error ? error.message : "Failed to analyze video",
        isAnalyzing: false,
      });
    }
  },

  // Get thumbnail styles
  getThumbnailStyles: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{
        success: boolean;
        styles: ThumbnailStyle[];
        message: string;
      }>("/ai-thumbnails/styles", undefined, { withCredentials: true });

      if (response.success) {
        set({
          availableStyles: response.styles,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || "Failed to get thumbnail styles");
      }
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get thumbnail styles",
        isLoading: false,
      });
    }
  },

  // Fetch uploaded videos
  fetchUploadedVideos: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{ videos: Video[] }>(
        "/videos",
        undefined,
        { withCredentials: true }
      );

      set({
        uploadedVideos: response.videos,
        isLoading: false,
      });
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch videos",
        isLoading: false,
      });
    }
  },

  // Select video
  selectVideo: (video) => {
    set({ selectedVideo: video });
  },

  // Upload video file
  uploadVideoFile: async (file) => {
    try {
      set({ isUploading: true, error: null });

      /* console log removed */

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      /* console log removed */

      // Upload to Cloudinary using the dedicated uploadFile method
      const uploadResponse = await apiClient.uploadFile<{
        success: boolean;
        data: {
          publicId: string;
          url: string;
          bytes: number;
          duration: number;
        };
        message: string;
      }>("/cloudinary/upload", formData, undefined, { withCredentials: true });

      /* console log removed */

      if (uploadResponse.success) {
        set({ isUploading: false });
        return {
          videoUrl: uploadResponse.data.url,
          title: file.name.replace(/\.[^/.]+$/, ""),
        };
      } else {
        throw new Error(uploadResponse.message || "Failed to upload video");
      }
    } catch (error) {
      /* console log removed */
      set({
        error:
          error instanceof Error ? error.message : "Failed to upload video",
        isUploading: false,
      });
      throw error;
    }
  },

  // Select thumbnail
  selectThumbnail: (thumbnail) => {
    set({ selectedThumbnail: thumbnail });
  },

  // Clear thumbnails
  clearThumbnails: () => {
    set({ generatedThumbnails: [], selectedThumbnail: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // AI img2img enhancement
  enhanceFrameWithAI: async (
    frameUrl: string,
    prompt: string,
    options: any = {}
  ) => {
    try {
      set({ isEnhancing: true, error: null });
      /* console log removed */
      /* console log removed */
      /* console log removed */
      /* console log removed */

      const response = await apiClient.post<{
        success: boolean;
        url: string;
        publicId: string;
        id: string;
        style: string;
        prompt: string;
        message: string;
      }>(
        "/ai-thumbnails/img2img",
        {
          frameUrl,
          prompt,
          ...options,
          videoTitle: options.videoTitle,
          videoDescription: options.videoDescription,
        },
        undefined,
        { withCredentials: true }
      );

      /* console log removed */

      set({ isEnhancing: false });
      if (response.success) {
        /* console log removed */
        // Return the complete thumbnail object
        const enhancedThumbnail = {
          url: response.url,
          publicId: response.publicId,
          id: response.id,
          style: response.style,
          prompt: response.prompt,
        };

        /* console log removed */

        // Add to generated thumbnails list
        set((state) => {
          /* console log removed */
          const newState = {
            generatedThumbnails: [
              ...state.generatedThumbnails,
              enhancedThumbnail,
            ],
          };
          /* console log removed */
          return newState;
        });

        /* console log removed */
        return enhancedThumbnail;
      } else {
        /* console log removed */
        set({ error: response.message || "Failed to enhance frame with AI" });
        return null;
      }
    } catch (error) {
      /* console log removed */
      set({
        isEnhancing: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to enhance frame with AI",
      });
      return null;
    }
  },

  // Apply overlay
  applyOverlay: async (publicId: string, overlayOptions: any) => {
    try {
      set({ isEnhancing: true, error: null });
      const response = await apiClient.post<{
        success: boolean;
        url: string;
        message: string;
      }>("/ai-thumbnails/overlay", { publicId, ...overlayOptions }, undefined, {
        withCredentials: true,
      });
      set({ isEnhancing: false });
      if (response.success) {
        return response.url;
      } else {
        set({ error: response.message || "Failed to apply overlay" });
        return null;
      }
    } catch (error) {
      set({
        isEnhancing: false,
        error:
          error instanceof Error ? error.message : "Failed to apply overlay",
      });
      return null;
    }
  },

  // Fallback to text-to-image
  fallbackTextToImage: async (prompt: string, options: any = {}) => {
    try {
      set({ isGenerating: true, error: null });
      const response = await apiClient.post<{
        success: boolean;
        url: string;
        publicId: string;
        message: string;
      }>(
        "/ai-thumbnails/text2img-fallback",
        { prompt, ...options },
        undefined,
        { withCredentials: true }
      );
      set({ isGenerating: false });
      if (response.success) {
        return { url: response.url, publicId: response.publicId };
      } else {
        set({
          error: response.message || "Failed to generate image from prompt",
        });
        return null;
      }
    } catch (error) {
      set({
        isGenerating: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate image from prompt",
      });
      return null;
    }
  },
}));
