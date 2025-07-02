import { create } from "zustand"
import { apiClient } from "@/lib/config/api"

interface Video {
  id: string
  title: string
  description: string
  tags: string[]
  thumbnail: string
  status: "pending" | "approved" | "published" | "rejected"
  uploadedBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  uploadedAt: string
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: string
  rejectedBy?: {
    id: string
    name: string
    email: string
  }
  rejectedAt?: string
  rejectionReason?: string
  youtubeId?: string
  youtubeUrl?: string
  fileSize: number
  duration: number
  cloudinaryVideoUrl: string
  cloudinaryThumbnailUrl: string
  category?: string
  privacy?: string
}

interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  isLoading: boolean
  error: string | null
  fetchVideos: () => Promise<void>
  fetchVideoById: (id: string) => Promise<void>
  uploadVideo: (videoData: {
    title: string
    description: string
    tags: string[]
    cloudinaryVideoId: string
    cloudinaryVideoUrl: string
    cloudinaryThumbnailId?: string
    cloudinaryThumbnailUrl: string
    duration: number
    fileSize: number
    category?: string
    privacy?: string
  }) => Promise<void>
  approveVideo: (id: string) => Promise<void>
  rejectVideo: (id: string, reason: string) => Promise<void>
  deleteVideo: (id: string) => Promise<void>
  clearError: () => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  currentVideo: null,
  isLoading: false,
  error: null,

  fetchVideos: async () => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<{ videos: Video[] }>("/videos", token)
      set({ videos: response.videos, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch videos",
        isLoading: false,
      })
    }
  },

  fetchVideoById: async (id: string) => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<{ video: Video }>(`/videos/${id}`, token)
      set({ currentVideo: response.video, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch video",
        isLoading: false,
      })
    }
  },

  uploadVideo: async (videoData) => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) throw new Error("Not authenticated")

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post<{ video: Video }>("/videos/upload", videoData, token)
      set((state) => ({
        videos: [response.video, ...state.videos],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to upload video",
        isLoading: false,
      })
      throw error
    }
  },

  approveVideo: async (id: string) => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) throw new Error("Not authenticated")

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post<{ video: Video }>(`/videos/${id}/approve`, {}, token)
      set((state) => ({
        videos: state.videos.map((v) => (v.id === id ? response.video : v)),
        currentVideo: state.currentVideo?.id === id ? response.video : state.currentVideo,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to approve video",
        isLoading: false,
      })
      throw error
    }
  },

  rejectVideo: async (id: string, reason: string) => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) throw new Error("Not authenticated")

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post<{ video: Video }>(`/videos/${id}/reject`, { reason }, token)
      set((state) => ({
        videos: state.videos.map((v) => (v.id === id ? response.video : v)),
        currentVideo: state.currentVideo?.id === id ? response.video : state.currentVideo,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to reject video",
        isLoading: false,
      })
      throw error
    }
  },

  deleteVideo: async (id: string) => {
    const token = localStorage.getItem("auth-storage")
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
      : null

    if (!token) throw new Error("Not authenticated")

    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/videos/${id}`, token)
      set((state) => ({
        videos: state.videos.filter((v) => v.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete video",
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
