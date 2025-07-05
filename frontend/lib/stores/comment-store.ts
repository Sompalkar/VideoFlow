import { create } from "zustand";
import { apiClient } from "@/lib/config/api";
import { socketService } from "@/lib/services/socket-service";

interface Comment {
  _id: string;
  videoId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  timestamp?: number;
  parentId?: string;
  mentions: string[];
  reactions: Array<{
    userId: string;
    type: "like" | "dislike" | "heart" | "laugh";
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  fetchComments: (videoId: string) => Promise<void>;
  addComment: (
    videoId: string,
    content: string,
    timestamp?: number,
    parentId?: string
  ) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleReaction: (
    commentId: string,
    type: "like" | "dislike" | "heart" | "laugh"
  ) => Promise<void>;
  clearError: () => void;
  initializeRealtime: (videoId: string) => void;
  cleanupRealtime: () => void;
  emitTyping: (videoId: string, isTyping: boolean) => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,
  typingUsers: [],

  fetchComments: async (videoId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{ comments: Comment[] }>(
        `/comments/${videoId}`,
        undefined,
        { withCredentials: true }
      );
      set({ comments: response.comments, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch comments",
        isLoading: false,
      });
    }
  },

  addComment: async (
    videoId: string,
    content: string,
    timestamp?: number,
    parentId?: string
  ) => {
    try {
      set({ error: null });

      const response = await apiClient.post<{ comment: Comment }>(
        `/comments/${videoId}`,
        {
          content,
          timestamp,
          parentId,
        },
        undefined,
        { withCredentials: true }
      );

      const { comments } = get();
      if (parentId) {
        // Add as reply
        const updatedComments = comments.map((comment) => {
          if (comment._id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.comment],
            };
          }
          return comment;
        });
        set({ comments: updatedComments });
      } else {
        // Add as new comment
        set({ comments: [response.comment, ...comments] });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to add comment",
      });
    }
  },

  updateComment: async (commentId: string, content: string) => {
    try {
      set({ error: null });

      const response = await apiClient.put<{ comment: Comment }>(
        `/comments/${commentId}`,
        { content },
        undefined,
        { withCredentials: true }
      );

      const { comments } = get();
      const updatedComments = comments.map((comment) => {
        if (comment._id === commentId) {
          return response.comment;
        }
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map((reply) =>
            reply._id === commentId ? response.comment : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      set({ comments: updatedComments });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update comment",
      });
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      set({ error: null });

      await apiClient.delete(`/comments/${commentId}`, undefined, {
        withCredentials: true,
      });

      const { comments } = get();
      const updatedComments = comments
        .filter((comment) => comment._id !== commentId)
        .map((comment) => ({
          ...comment,
          replies:
            comment.replies?.filter((reply) => reply._id !== commentId) || [],
        }));
      set({ comments: updatedComments });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete comment",
      });
    }
  },

  toggleReaction: async (
    commentId: string,
    type: "like" | "dislike" | "heart" | "laugh"
  ) => {
    try {
      set({ error: null });

      const response = await apiClient.post<{ comment: Comment }>(
        `/comments/${commentId}/reaction`,
        { type },
        undefined,
        { withCredentials: true }
      );

      const { comments } = get();
      const updatedComments = comments.map((comment) => {
        if (comment._id === commentId) {
          return response.comment;
        }
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map((reply) =>
            reply._id === commentId ? response.comment : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      set({ comments: updatedComments });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to toggle reaction",
      });
    }
  },

  clearError: () => set({ error: null }),

  initializeRealtime: (videoId: string) => {
    // Connect to socket (cookies will be automatically sent)
    socketService.connect();

    // Join video room
    socketService.joinVideoRoom(videoId);

    // Set up real-time listeners
    socketService.onCommentAdded((comment) => {
      const { comments } = get();
      if (comment.parentId) {
        // Add as reply
        const updatedComments = comments.map((c) => {
          if (c._id === comment.parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), comment],
            };
          }
          return c;
        });
        set({ comments: updatedComments });
      } else {
        // Add as new comment
        set({ comments: [comment, ...comments] });
      }
    });

    socketService.onCommentUpdated((comment) => {
      const { comments } = get();
      const updatedComments = comments.map((c) => {
        if (c._id === comment._id) {
          return comment;
        }
        // Check replies
        if (c.replies) {
          const updatedReplies = c.replies.map((reply) =>
            reply._id === comment._id ? comment : reply
          );
          return { ...c, replies: updatedReplies };
        }
        return c;
      });
      set({ comments: updatedComments });
    });

    socketService.onCommentDeleted((commentId) => {
      const { comments } = get();
      const updatedComments = comments
        .filter((comment) => comment._id !== commentId)
        .map((comment) => ({
          ...comment,
          replies:
            comment.replies?.filter((reply) => reply._id !== commentId) || [],
        }));
      set({ comments: updatedComments });
    });

    socketService.onReactionUpdated(({ commentId, reactions }) => {
      const { comments } = get();
      const updatedComments = comments.map((comment) => {
        if (comment._id === commentId) {
          return { ...comment, reactions };
        }
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map((reply) =>
            reply._id === commentId ? { ...reply, reactions } : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      set({ comments: updatedComments });
    });

    socketService.onUserTyping(({ userId, userName, isTyping }) => {
      const { typingUsers } = get();
      if (isTyping) {
        if (!typingUsers.includes(userName)) {
          set({ typingUsers: [...typingUsers, userName] });
        }
      } else {
        set({ typingUsers: typingUsers.filter((name) => name !== userName) });
      }
    });
  },

  cleanupRealtime: () => {
    socketService.disconnect();
    set({ typingUsers: [] });
  },

  emitTyping: (videoId: string, isTyping: boolean) => {
    socketService.emitTyping(videoId, isTyping);
  },
}));
