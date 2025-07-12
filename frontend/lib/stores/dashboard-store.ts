import { create } from "zustand";

interface Analytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgWatchTime: string;
  viewsGrowth: number;
  likesGrowth: number;
  commentsGrowth: number;
  watchTimeGrowth: number;
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    publishedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: string;
  }>;
}

interface DashboardState {
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;
  isFetching: boolean;
  fetchAnalytics: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  analytics: null,
  isLoading: false,
  error: null,
  isFetching: false,

  fetchAnalytics: async () => {
    const state = get();

    // Prevent multiple simultaneous requests
    if (state.isFetching) {
      console.log("DashboardStore: Request already in progress, skipping...");
      return;
    }

    set({ isLoading: true, error: null, isFetching: true });

    try {
      // Use static analytics data instead of API call
      const staticAnalytics: Analytics = {
        totalViews: 125000,
        totalLikes: 8500,
        totalComments: 1200,
        avgWatchTime: "4:32",
        viewsGrowth: 12.5,
        likesGrowth: 8.2,
        commentsGrowth: 15.3,
        watchTimeGrowth: 6.8,
        topVideos: [
          {
            id: "1",
            title: "How to Create Amazing Content",
            views: 15000,
            likes: 850,
            publishedAt: "2024-01-15",
          },
          {
            id: "2",
            title: "Video Editing Tips & Tricks",
            views: 8500,
            likes: 420,
            publishedAt: "2024-01-12",
          },
          {
            id: "3",
            title: "Behind the Scenes",
            views: 6200,
            likes: 320,
            publishedAt: "2024-01-10",
          },
        ],
        recentActivity: [
          {
            id: "1",
            type: "publish",
            message: "Video 'How to Create Amazing Content' was published",
            timestamp: "2024-01-15T10:30:00Z",
            user: "John Doe",
          },
          {
            id: "2",
            type: "approval",
            message: "Video 'Video Editing Tips' was approved",
            timestamp: "2024-01-12T14:20:00Z",
            user: "Jane Smith",
          },
        ],
      };

      set({ analytics: staticAnalytics, isLoading: false, isFetching: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
        isLoading: false,
        isFetching: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
