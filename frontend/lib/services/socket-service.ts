import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      }
    );

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts++;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      this.isConnected = true;
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinVideoRoom(videoId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-video-room", { videoId });
    }
  }

  leaveVideoRoom(videoId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-video-room", { videoId });
    }
  }

  onCommentAdded(callback: (comment: any) => void) {
    if (this.socket) {
      this.socket.on("comment-added", callback);
    }
  }

  onCommentUpdated(callback: (comment: any) => void) {
    if (this.socket) {
      this.socket.on("comment-updated", callback);
    }
  }

  onCommentDeleted(callback: (commentId: string) => void) {
    if (this.socket) {
      this.socket.on("comment-deleted", callback);
    }
  }

  onReactionUpdated(
    callback: (data: { commentId: string; reactions: any[] }) => void
  ) {
    if (this.socket) {
      this.socket.on("reaction-updated", callback);
    }
  }

  onUserTyping(
    callback: (data: {
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => void
  ) {
    if (this.socket) {
      this.socket.on("user-typing", callback);
    }
  }

  emitTyping(videoId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit("typing", { videoId, isTyping });
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
