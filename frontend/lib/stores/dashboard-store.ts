import { create } from "zustand";
import { apiClient } from "@/lib/config/api";

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
  fetchAnalytics: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  analytics: null,
  isLoading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ analytics: Analytics }>(
        "/analytics",
        undefined,
        { withCredentials: true }
      );
      set({ analytics: response.analytics, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
