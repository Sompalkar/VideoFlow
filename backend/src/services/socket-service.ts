import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  teamId?: string;
}

interface VideoRoom {
  videoId: string;
  users: Set<string>;
}

interface JoinVideoRoomData {
  videoId: string;
}

interface LeaveVideoRoomData {
  videoId: string;
}

interface TypingData {
  videoId: string;
  isTyping: boolean;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private videoRooms: Map<string, VideoRoom> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        const token = (socket as any).handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).userName = decoded.name;
        (socket as AuthenticatedSocket).teamId = decoded.teamId;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      console.log(
        `User connected: ${authSocket.userName} (${authSocket.userId})`
      );

      // Join video room
      socket.on("join-video-room", (data: JoinVideoRoomData) => {
        this.joinVideoRoom(authSocket, data.videoId);
      });

      // Leave video room
      socket.on("leave-video-room", (data: LeaveVideoRoomData) => {
        this.leaveVideoRoom(authSocket, data.videoId);
      });

      // Handle typing indicators
      socket.on("typing", (data: TypingData) => {
        this.handleTyping(authSocket, data.videoId, data.isTyping);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(
          `User disconnected: ${authSocket.userName} (${authSocket.userId})`
        );
        this.handleDisconnect(authSocket);
      });
    });
  }

  private joinVideoRoom(socket: AuthenticatedSocket, videoId: string) {
    socket.join(`video-${videoId}`);

    if (!this.videoRooms.has(videoId)) {
      this.videoRooms.set(videoId, { videoId, users: new Set() });
    }

    const room = this.videoRooms.get(videoId)!;
    room.users.add(socket.userId!);

    console.log(`User ${socket.userName} joined video room: ${videoId}`);
  }

  private leaveVideoRoom(socket: AuthenticatedSocket, videoId: string) {
    socket.leave(`video-${videoId}`);

    const room = this.videoRooms.get(videoId);
    if (room) {
      room.users.delete(socket.userId!);
      if (room.users.size === 0) {
        this.videoRooms.delete(videoId);
      }
    }

    console.log(`User ${socket.userName} left video room: ${videoId}`);
  }

  private handleTyping(
    socket: AuthenticatedSocket,
    videoId: string,
    isTyping: boolean
  ) {
    socket.to(`video-${videoId}`).emit("user-typing", {
      userId: socket.userId,
      userName: socket.userName,
      isTyping,
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    // Remove user from all video rooms
    for (const [videoId, room] of this.videoRooms.entries()) {
      if (room.users.has(socket.userId!)) {
        room.users.delete(socket.userId!);
        if (room.users.size === 0) {
          this.videoRooms.delete(videoId);
        }
      }
    }
  }

  // Emit comment events
  emitCommentAdded(videoId: string, comment: any) {
    if (this.io) {
      this.io.to(`video-${videoId}`).emit("comment-added", comment);
    }
  }

  emitCommentUpdated(videoId: string, comment: any) {
    if (this.io) {
      this.io.to(`video-${videoId}`).emit("comment-updated", comment);
    }
  }

  emitCommentDeleted(videoId: string, commentId: string) {
    if (this.io) {
      this.io.to(`video-${videoId}`).emit("comment-deleted", commentId);
    }
  }

  emitReactionUpdated(videoId: string, commentId: string, reactions: any[]) {
    if (this.io) {
      this.io.to(`video-${videoId}`).emit("reaction-updated", {
        commentId,
        reactions,
      });
    }
  }

  getIO() {
    return this.io;
  }
}

export const socketService = new SocketService();
