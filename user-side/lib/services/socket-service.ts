import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingRoomJoins: string[] = [];

  connect() {
    console.log("Frontend: SocketService.connect() called");
    console.log("Frontend: Current socket state:", {
      socketExists: !!this.socket,
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected
    });
    
    if (this.socket?.connected) {
      console.log("Socket already connected, skipping...");
      return;
    }

    console.log("Connecting to socket with cookies...");
    console.log(
      "Backend URL:",
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
    );

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

    console.log("Frontend: Socket instance created:", !!this.socket);

    this.socket.on("connect", () => {
      console.log("Socket connected successfully");
      console.log("Socket ID:", this.socket?.id);
      console.log("Socket connected:", this.socket?.connected);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join any pending rooms
      this.pendingRoomJoins.forEach((videoId) => {
        console.log("Frontend: Joining pending room:", videoId);
        this.socket?.emit("join-video-room", { videoId });
      });
      this.pendingRoomJoins = [];
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      console.error("Error details:", error.message);
      console.error("Error data:", error.data);
      console.error("Error type:", error.type);
      this.reconnectAttempts++;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      this.isConnected = true;
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error event:", error);
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
      console.log("Frontend: Joining video room:", videoId);
      this.socket.emit("join-video-room", { videoId });
    } else {
      console.log(
        "Frontend: Socket not connected, queuing room join for:",
        videoId
      );
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
      console.log("Frontend: Setting up comment-added listener");
      this.socket.on("comment-added", (comment) => {
        console.log("Frontend: Received comment-added event:", comment);
        callback(comment);
      });
    }
  }

  onCommentUpdated(callback: (comment: any) => void) {
    if (this.socket) {
      console.log("Frontend: Setting up comment-updated listener");
      this.socket.on("comment-updated", (comment) => {
        console.log("Frontend: Received comment-updated event:", comment);
        callback(comment);
      });
    }
  }

  onCommentDeleted(callback: (commentId: string) => void) {
    if (this.socket) {
      console.log("Frontend: Setting up comment-deleted listener");
      this.socket.on("comment-deleted", (commentId) => {
        console.log("Frontend: Received comment-deleted event:", commentId);
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
          console.error("Frontend: Socket connection timeout");
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
