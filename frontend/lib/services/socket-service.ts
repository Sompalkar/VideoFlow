import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingRoomJoins: string[] = [];

  connect() {
    /* console log removed */
    /* console log removed */
    
    if (this.socket?.connected) {
      /* console log removed */
      return;
    }

    /* console log removed */
    /* console log removed */

    this.socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        withCredentials: true,
        timeout: 20000, // 20 second timeout
      }
    );

    /* console log removed */

    this.socket.on("connect", () => {
      /* console log removed */
      /* console log removed */
      /* console log removed */
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join any pending rooms
      this.pendingRoomJoins.forEach((videoId) => {
        /* console log removed */
        this.socket?.emit("join-video-room", { videoId });
      });
      this.pendingRoomJoins = [];
    });

    this.socket.on("disconnect", (reason) => {
      /* console log removed */
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      /* console log removed */
      /* console log removed */
      /* console log removed */
      /* console log removed */
      this.reconnectAttempts++;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      /* console log removed */
      this.isConnected = true;
    });

    this.socket.on("reconnect_failed", () => {
      /* console log removed */
    });

    this.socket.on("error", (error) => {
      /* console log removed */
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
      /* console log removed */
      this.socket.emit("join-video-room", { videoId });
    } else {
      /* console log removed */
      if (!this.pendingRoomJoins.includes(videoId)) {
        this.pendingRoomJoins.push(videoId);
      }
      // Try to connect if not already connecting
      if (!this.socket) {
        this.connect();
      }
    }
  }

  leaveVideoRoom(videoId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-video-room", { videoId });
    }
  }

  onCommentAdded(callback: (comment: any) => void) {
    if (this.socket) {
      /* console log removed */
      this.socket.on("comment-added", (comment) => {
        /* console log removed */
        callback(comment);
      });
    }
  }

  onCommentUpdated(callback: (comment: any) => void) {
    if (this.socket) {
      /* console log removed */
      this.socket.on("comment-updated", (comment) => {
        /* console log removed */
        callback(comment);
      });
    }
  }

  onCommentDeleted(callback: (commentId: string) => void) {
    if (this.socket) {
      /* console log removed */
      this.socket.on("comment-deleted", (commentId) => {
        /* console log removed */
        callback(commentId);
      });
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

  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkConnection = () => {
        if (this.isConnected) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          /* console log removed */
          resolve(false);
          return;
        }

        setTimeout(checkConnection, 100);
      };

      checkConnection();
    });
  }
}

export const socketService = new SocketService();
