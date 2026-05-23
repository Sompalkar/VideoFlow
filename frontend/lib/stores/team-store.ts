import { create } from "zustand";
import { apiClient } from "@/lib/config/api";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "creator" | "editor" | "manager";
  status: "active" | "pending";
  joinedAt: string;
}

interface TeamState {
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  fetchTeamMembers: () => Promise<void>;
  inviteMember: (
    email: string,
    role: "creator" | "editor" | "manager"
  ) => Promise<void>;
  updateMemberRole: (
    memberId: string,
    role: "creator" | "editor" | "manager"
  ) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  fetchTeamMembers: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.get<{ members: TeamMember[] }>(
        "/team",
        undefined,
        { withCredentials: true }
      );
      set({ members: response.members, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch team members",
        isLoading: false,
      });
    }
  },

  inviteMember: async (
    email: string,
    role: "creator" | "editor" | "manager"
  ) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post<{ member: TeamMember }>(
        "/team/invite",
        { email, role },
        undefined,
        { withCredentials: true }
      );

      const currentMembers = get().members;
      set({
        members: [...currentMembers, response.member],
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to invite member",
        isLoading: false,
      });
      throw error;
    }
  },

  updateMemberRole: async (
    memberId: string,
    role: "creator" | "editor" | "manager"
  ) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.put<{ member: TeamMember }>(
        `/team/${memberId}/role`,
        { role },
        undefined,
        { withCredentials: true }
      );

      const currentMembers = get().members;
      const updatedMembers = currentMembers.map((member) =>
        member.id === memberId ? response.member : member
      );

      set({ members: updatedMembers, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update member role",
        isLoading: false,
      });
    }
  },

  removeMember: async (memberId: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.delete(`/team/${memberId}`, undefined, {
        withCredentials: true,
      });

      const currentMembers = get().members;
      const updatedMembers = currentMembers.filter(
        (member) => member.id !== memberId
      );

      set({ members: updatedMembers, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to remove member",
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
