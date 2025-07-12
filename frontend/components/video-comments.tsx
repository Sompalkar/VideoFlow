"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Clock,
  AlertCircle,
  Loader2,
  AtSign,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useCommentStore } from "@/lib/stores/comment-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

interface VideoCommentsProps {
  videoId: string;
  currentTime?: number;
  onSeekTo?: (time: number) => void;
}

export function VideoComments({
  videoId,
  currentTime = 0,
  onSeekTo,
}: VideoCommentsProps) {
  const { user } = useAuthStore();
  const {
    comments,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    fetchComments,
    loadMoreComments,
    addComment,
    updateComment,
    deleteComment,
    toggleReaction,
    clearError,
    refreshComments,
  } = useCommentStore();

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showTimestampPicker, setShowTimestampPicker] = useState(false);
  const [customTimestamp, setCustomTimestamp] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && pagination?.hasMore) {
          console.log(
            "VideoComments: Loading more comments via intersection observer"
          );
          loadMoreComments(videoId);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreComments, videoId, isLoadingMore, pagination?.hasMore]);

  useEffect(() => {
    if (videoId) {
      console.log("VideoComments: Initializing for video:", videoId);
      fetchComments(videoId);
    }
  }, [videoId]); // Remove fetchComments from dependencies

  useEffect(() => {
    // Auto-scroll to bottom when new comments are added (only for first page)
    if (commentsContainerRef.current && pagination?.page === 1) {
      commentsContainerRef.current.scrollTop =
        commentsContainerRef.current.scrollHeight;
    }
  }, [comments, pagination?.page]);

  // Debug logging
  useEffect(() => {
    console.log("VideoComments: Comments state updated:", {
      commentsCount: comments.length,
      isLoading,
      isLoadingMore,
      pagination,
      comments: comments.map((c) => ({
        id: c._id,
        content: c.content.substring(0, 20) + "...",
      })),
    });
  }, [comments, isLoading, isLoadingMore, pagination]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      console.log("VideoComments: Submitting comment:", {
        videoId,
        content: newComment,
        timestamp: includeTimestamp
          ? customTimestamp || currentTime
          : undefined,
        parentId: replyingTo,
      });

      setIsSubmitting(true);
      const timestamp = includeTimestamp
        ? customTimestamp || currentTime
        : undefined;
      await addComment(videoId, newComment, timestamp, replyingTo);
      setNewComment("");
      setReplyingTo(null);
      setIncludeTimestamp(false);
      setCustomTimestamp(0);
      console.log("VideoComments: Comment submitted successfully");
    } catch (error) {
      console.error("VideoComments: Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReaction = async (
    commentId: string,
    type: "like" | "dislike" | "heart" | "laugh"
  ) => {
    try {
      await toggleReaction(commentId, type);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="w-4 h-4" />;
      case "dislike":
        return <ThumbsDown className="w-4 h-4" />;
      case "heart":
        return <Heart className="w-4 h-4" />;
      case "laugh":
        return <Laugh className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getUserReaction = (comment: any) => {
    return comment.reactions.find((r: any) => r.userId === user?.id)?.type;
  };

  const getReactionCount = (comment: any, type: string) => {
    return comment.reactions.filter((r: any) => r.type === type).length;
  };

  const handleTimestampClick = (time: number) => {
    if (onSeekTo) {
      onSeekTo(time);
    }
  };

  const handleAddTimestamp = () => {
    setCustomTimestamp(currentTime);
    setIncludeTimestamp(true);
    setShowTimestampPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };

  const handleRefresh = () => {
    console.log("VideoComments: Manual refresh requested");
    fetchComments(videoId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Live Chat ({pagination?.total || comments.length})
          {pagination?.hasMore && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (showing {comments.length} of {pagination.total})
            </span>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="my-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Comments List - Live Chat Style */}
      <div
        ref={commentsContainerRef}
        className="flex-1 overflow-y-auto space-y-3 p-2 comments-scroll max-h-[60vh]"
      >
        {isLoading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-6 h-6 mr-2" />
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment._id} className="space-y-2">
                {/* Main Comment */}
                <div
                  className={cn(
                    "flex gap-3 p-3 rounded-lg transition-all duration-200",
                    comment.timestamp !== undefined
                      ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                      : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={comment.userId?.avatar || "/placeholder.svg"}
                      alt={comment.userId?.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                      {comment.userId?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {comment.userId?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {comment.timestamp !== undefined && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-1 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                          onClick={() =>
                            handleTimestampClick(comment.timestamp!)
                          }
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(comment.timestamp)}
                        </Button>
                      )}
                      {comment.isEdited && (
                        <Badge variant="secondary" className="text-xs">
                          Edited
                        </Badge>
                      )}
                    </div>

                    {editingComment === comment._id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment._id)}
                            disabled={!editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">
                        {comment.content}
                      </p>
                    )}

                    {/* Reactions and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {["like", "dislike", "heart", "laugh"].map((type) => {
                          const count = getReactionCount(comment, type);
                          const userReacted = getUserReaction(comment) === type;

                          return (
                            <Button
                              key={type}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 px-2 text-xs transition-colors",
                                userReacted && "bg-primary/10 text-primary"
                              )}
                              onClick={() =>
                                handleReaction(comment._id, type as any)
                              }
                            >
                              {getReactionIcon(type)}
                              {count > 0 && (
                                <span className="ml-1">{count}</span>
                              )}
                            </Button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(comment._id);
                            textareaRef.current?.focus();
                          }}
                          className="text-xs h-7"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>

                        {comment.userId?._id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingComment(comment._id);
                                  setEditContent(comment.content);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(comment._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-11 space-y-2">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="flex gap-3 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30"
                      >
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage
                            src={reply.userId?.avatar || "/placeholder.svg"}
                            alt={reply.userId?.name || "User"}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-xs">
                            {reply.userId?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
                              {reply.userId?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(reply.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            {reply.timestamp !== undefined && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-1 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                                onClick={() =>
                                  handleTimestampClick(reply.timestamp!)
                                }
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(reply.timestamp)}
                              </Button>
                            )}
                            {reply.isEdited && (
                              <Badge variant="secondary" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Infinite Scroll Trigger */}
            {pagination?.hasMore && (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-4"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading more comments...</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMoreComments(videoId)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Load More Comments
                  </Button>
                )}
              </div>
            )}

            <div ref={commentsEndRef} />
          </>
        )}
      </div>

      {/* Add Comment - Fixed at Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarImage
              src={user?.avatar || "/placeholder.svg"}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={
                  replyingTo ? "Write a reply..." : "Type your message..."
                }
                value={newComment}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                className="min-h-[50px] max-h-[100px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncludeTimestamp(!includeTimestamp)}
                  className={cn(
                    "text-xs h-7 px-2",
                    includeTimestamp && "bg-primary text-primary-foreground"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {includeTimestamp
                    ? `@ ${formatTimestamp(customTimestamp || currentTime)}`
                    : "Add timestamp"}
                </Button>

                {includeTimestamp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimestampPicker(true)}
                    className="text-xs h-7 px-2"
                  >
                    <AtSign className="w-3 h-3 mr-1" />
                    Set time
                  </Button>
                )}

                {replyingTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="text-xs h-7 px-2"
                  >
                    Cancel Reply
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-7 px-3"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp Picker Dialog */}
      <Dialog open={showTimestampPicker} onOpenChange={setShowTimestampPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Timestamp</DialogTitle>
            <DialogDescription>
              Choose a specific time for this comment
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleAddTimestamp}
                className="flex-1"
              >
                Current Time ({formatTimestamp(currentTime)})
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Custom Time (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={customTimestamp}
                onChange={(e) => setCustomTimestamp(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter time in seconds"
              />
              {customTimestamp > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(customTimestamp)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTimestampPicker(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowTimestampPicker(false)}>
              Set Timestamp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && handleDeleteComment(deleteConfirmId)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
