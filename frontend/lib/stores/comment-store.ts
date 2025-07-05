import { create } from "zustand";
import { apiClient } from "@/lib/config/api";

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  fetchComments: (videoId: string, page?: number) => Promise<void>;
  loadMoreComments: (videoId: string) => Promise<void>;
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
  refreshComments: (videoId: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pagination: null,

  fetchComments: async (videoId: string, page = 1) => {
    try {
      console.log(
        "Comment store: Fetching comments for video:",
        videoId,
        "page:",
        page
      );
      set({ isLoading: true, error: null });

      const response = await apiClient.get<{
        comments: Comment[];
        pagination: PaginationInfo;
      }>(`/comments/${videoId}?page=${page}&limit=50`, undefined, {
        withCredentials: true,
      });

      console.log("Comment store: Raw API response:", response);
      console.log(
        "Comment store: Fetched comments from API:",
        response.comments
      );
      console.log("Comment store: Comments count:", response.comments.length);
      console.log("Comment store: Pagination info:", response.pagination);

      // Ensure we have a valid response
      if (response && response.comments) {
        if (page === 1) {
          // First page - replace all comments
          set({
            comments: response.comments,
            pagination: response.pagination,
            isLoading: false,
          });
        } else {
          // Subsequent pages - append to existing comments
          const { comments: existingComments } = get();
          const newComments = [...existingComments, ...response.comments];
          set({
            comments: newComments,
            pagination: response.pagination,
            isLoading: false,
          });
        }
        console.log("Comment store: Successfully set comments in state");
      } else {
        console.error("Comment store: Invalid response structure:", response);
        set({ comments: [], pagination: null, isLoading: false });
      }
    } catch (error) {
      console.error("Comment store: Error fetching comments:", error);
      console.error("Comment store: Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch comments",
        isLoading: false,
        comments: [], // Clear comments on error
        pagination: null,
      });
    }
  },

  loadMoreComments: async (videoId: string) => {
    try {
      const { pagination } = get();
      if (!pagination || !pagination.hasMore) {
        console.log("Comment store: No more comments to load");
        return;
      }

      console.log(
        "Comment store: Loading more comments, page:",
        pagination.page + 1
      );
      set({ isLoadingMore: true });

      const response = await apiClient.get<{
        comments: Comment[];
        pagination: PaginationInfo;
      }>(
        `/comments/${videoId}?page=${pagination.page + 1}&limit=50`,
        undefined,
        { withCredentials: true }
      );

      if (response && response.comments) {
        const { comments: existingComments } = get();
        const newComments = [...existingComments, ...response.comments];
        set({
          comments: newComments,
          pagination: response.pagination,
          isLoadingMore: false,
        });
        console.log(
          "Comment store: Loaded more comments, total:",
          newComments.length
        );
      }
    } catch (error) {
      console.error("Comment store: Error loading more comments:", error);
      set({
        isLoadingMore: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more comments",
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
      console.log("Comment store: Adding comment via API:", {
        videoId,
        content,
        timestamp,
        parentId,
      });
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

      console.log("Comment store: API response:", response.comment);
      console.log("Comment store: API response structure:", {
        hasId: !!response.comment._id,
        hasContent: !!response.comment.content,
        hasUserId: !!response.comment.userId,
        hasCreatedAt: !!response.comment.createdAt,
      });

      // Add the new comment to the local state immediately for better UX
      const { comments } = get();
      const newComment = response.comment;

      console.log(
        "Comment store: Current comments before adding:",
        comments.length
      );
      console.log("Comment store: New comment to add:", {
        id: newComment._id,
        content: newComment.content,
        userId: newComment.userId,
      });

      // Ensure the comment has all required fields
      if (!newComment._id || !newComment.content || !newComment.userId) {
        console.error("Comment store: Invalid comment structure:", newComment);
        throw new Error("Invalid comment structure received from server");
      }

      if (parentId) {
        // Add as reply
        const updatedComments = comments.map((comment) => {
          if (comment._id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        });
        set({ comments: updatedComments });
        console.log(
          "Comment store: Added reply, new count:",
          updatedComments.length
        );
      } else {
        // Add as new comment to the bottom of the list
        const newComments = [...comments, newComment];
        set({ comments: newComments });
        console.log(
          "Comment store: Added new comment to bottom, new count:",
          newComments.length
        );
        console.log(
          "Comment store: New comments array:",
          newComments.map((c) => ({
            id: c._id,
            content: c.content.substring(0, 20),
          }))
        );
      }

      // Don't refresh automatically - let the user refresh manually if needed
      // This prevents the comment from disappearing
    } catch (error) {
      console.error("Comment store: Error adding comment:", error);
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

  refreshComments: async (videoId: string) => {
    try {
      console.log("Comment store: Refreshing comments for video:", videoId);
      // Reset to first page when refreshing
      await get().fetchComments(videoId, 1);
    } catch (error) {
      console.error("Comment store: Error refreshing comments:", error);
      set({ isLoading: false });
    }
  },
}));
