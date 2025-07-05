import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/config/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "creator" | "editor" | "manager";
  avatar?: string;
  youtubeConnected: boolean;
  needsPasswordChange?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: "creator" | "editor" | "manager";
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: { name: string; avatar?: string }) => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // Initialize auth state on app startup
      initialize: async () => {
        try {
          // Try to refresh token to validate current session
          await get().refreshToken();
        } catch (error) {
          console.log("No valid session found, user needs to login");
          // Clear any stale user data
          set({ user: null });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{ user: User }>(
            "/auth/login",
            {
              email,
              password,
            },
            undefined,
            { withCredentials: true }
          );

          set({
            user: response.user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{ user: User }>(
            "/auth/register",
            userData,
            undefined,
            { withCredentials: true }
          );

          set({
            user: response.user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout", {}, undefined, {
            withCredentials: true,
          });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ user: null, error: null });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put<{ user: User }>(
            "/auth/profile",
            data,
            undefined,
            { withCredentials: true }
          );

          set({
            user: response.user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Profile update failed",
            isLoading: false,
          });
          throw error;
        }
      },

      refreshToken: async () => {
        try {
          const response = await apiClient.post<{ user: User }>(
            "/auth/refresh",
            {},
            undefined,
            { withCredentials: true }
          );

          set({
            user: response.user,
          });
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post(
            "/auth/change-password",
            {
              currentPassword,
              newPassword,
            },
            undefined,
            { withCredentials: true }
          );

          // Refresh user data to update needsPasswordChange flag
          await get().refreshToken();
          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Password change failed",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
