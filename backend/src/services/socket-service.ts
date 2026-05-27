import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import User from "../models/User";

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

// Helper function to parse cookies
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  cookieString.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = value;
    }
  });

  return cookies;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private videoRooms: Map<string, VideoRoom> = new Map();

  initialize(server: HTTPServer) {
    /* console log removed */

    // Check for JWT secret
    const getJWTSecret = (): string => {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error(
          "JWT_SECRET environment variable is required. Please set it in your .env file."
        );
      }
      return jwtSecret;
    };

    const jwtSecret = getJWTSecret();
    /* console log removed */
    /* console log removed */

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        /* console log removed */

        // Try to get token from auth object first (for backward compatibility)
        let token = (socket as any).handshake.auth.token;

        // If not in auth, try to get from cookies
        if (!token) {
          const cookies = (socket as any).handshake.headers.cookie;
          /* console log removed */

          if (cookies) {
            const parsedCookies = parseCookies(cookies);
            /* console log removed */

            token = parsedCookies["auth-token"];
            if (token) {
              /* console log removed */
            } else {
              /* console log removed */
            }
          }
        }

        if (!token) {
          /* console log removed */
          return next(new Error("Authentication error"));
        }

        /* console log removed */
        const decoded = jwt.verify(token, jwtSecret) as any;
        /* console log removed */

        // Fetch user data from database
        const user = await User.findById(decoded.userId).select("name teamId");
        if (!user) {
          /* console log removed */
          return next(new Error("User not found"));
        }

        /* console log removed */

        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).userName = user.name;
        (socket as AuthenticatedSocket).teamId = user.teamId?.toString();
        next();
      } catch (error) {
        /* console log removed */
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      /* console log removed */
      /* console log removed */

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
        /* console log removed */
        this.handleDisconnect(authSocket);
      });
    });
  }

  private joinVideoRoom(socket: AuthenticatedSocket, videoId: string) {
    /* console log removed */

    socket.join(`video-${videoId}`);

    if (!this.videoRooms.has(videoId)) {
      this.videoRooms.set(videoId, { videoId, users: new Set() });
    }

    const room = this.videoRooms.get(videoId)!;
    room.users.add(socket.userId!);

    /* console log removed */
    /* console log removed */
    /* console log removed */

    // Verify the user is actually in the socket room
    if (this.io) {
      const socketRoom = this.io.sockets.adapter.rooms.get(`video-${videoId}`);
      if (socketRoom) {
        /* console log removed */
        /* console log removed */
      }
    }
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

    /* console log removed */
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
      /* console log removed */
      /* console log removed */

      // Get the room and check who's in it
      const room = this.io.sockets.adapter.rooms.get(`video-${videoId}`);
      if (room) {
        /* console log removed */
        room.forEach((socketId) => {
          /* console log removed */
        });
      } else {
        /* console log removed */
      }

      this.io.to(`video-${videoId}`).emit("comment-added", comment);
    } else {
      /* console log removed */
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
