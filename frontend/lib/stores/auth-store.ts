import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/lib/config/api"

interface User {
  id: string
  email: string
  name: string
  role: "creator" | "editor" | "manager"
  avatar?: string
  youtubeConnected: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    name: string
    email: string
    password: string
    role: "creator" | "editor" | "manager"
  }) => Promise<void>
  logout: () => void
  clearError: () => void
  updateProfile: (data: { name: string; avatar?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post<{ user: User; token: string }>("/auth/login", {
            email,
            password,
          })

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post<{ user: User; token: string }>("/auth/register", userData)

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },

      updateProfile: async (data) => {
        const { token } = get()
        if (!token) throw new Error("Not authenticated")

        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.put<{ user: User }>("/auth/profile", data, token)

          set({
            user: response.user,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Profile update failed",
            isLoading: false,
          })
          throw error
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
)
