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
    console.log("Initializing Socket.IO service...");

    // Check for JWT secret
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    console.log("JWT Secret available:", !!jwtSecret);
    console.log("Using JWT secret:", jwtSecret.substring(0, 10) + "...");

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        console.log("Socket authentication attempt...");

        // Try to get token from auth object first (for backward compatibility)
        let token = (socket as any).handshake.auth.token;

        // If not in auth, try to get from cookies
        if (!token) {
          const cookies = (socket as any).handshake.headers.cookie;
          console.log("Cookies from handshake:", cookies);

          if (cookies) {
            const parsedCookies = parseCookies(cookies);
            console.log("Parsed cookies:", Object.keys(parsedCookies));

            token = parsedCookies["auth-token"];
            if (token) {
              console.log(
                "Found auth token in cookie:",
                token.substring(0, 20) + "..."
              );
            } else {
              console.log("No auth-token found in cookies");
            }
          }
        }

        if (!token) {
          console.log("No token found in auth or cookies");
          return next(new Error("Authentication error"));
        }

        console.log("Verifying JWT token...");
        const decoded = jwt.verify(token, jwtSecret) as any;
        console.log("JWT decoded successfully for user:", decoded.userId);

        // Fetch user data from database
        const user = await User.findById(decoded.userId).select("name teamId");
        if (!user) {
          console.log("User not found in database:", decoded.userId);
          return next(new Error("User not found"));
        }

        console.log("User found:", user.name);

        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).userName = user.name;
        (socket as AuthenticatedSocket).teamId = user.teamId?.toString();
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      console.log(
        `User connected: ${authSocket.userName} (${authSocket.userId})`
      );
      console.log(`Socket ID: ${socket.id}`);

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
    console.log(
      `Socket: User ${socket.userName} (${socket.userId}) joining video room: ${videoId}`
    );

    socket.join(`video-${videoId}`);

    if (!this.videoRooms.has(videoId)) {
      this.videoRooms.set(videoId, { videoId, users: new Set() });
    }

    const room = this.videoRooms.get(videoId)!;
    room.users.add(socket.userId!);

    console.log(`User ${socket.userName} joined video room: ${videoId}`);
    console.log(`Total users in room ${videoId}: ${room.users.size}`);
    console.log(`Users in room:`, Array.from(room.users));

    // Verify the user is actually in the socket room
    if (this.io) {
      const socketRoom = this.io.sockets.adapter.rooms.get(`video-${videoId}`);
      if (socketRoom) {
        console.log(`Socket room ${videoId} has ${socketRoom.size} sockets`);
        console.log(
          `Socket ${socket.id} is in room: ${socketRoom.has(socket.id)}`
        );
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
      console.log(
        `Socket: Emitting comment-added to video room: video-${videoId}`
      );
      console.log(`Socket: Comment data:`, JSON.stringify(comment, null, 2));

      // Get the room and check who's in it
      const room = this.io.sockets.adapter.rooms.get(`video-${videoId}`);
      if (room) {
        console.log(`Socket: Users in room video-${videoId}:`, room.size);
        room.forEach((socketId) => {
          console.log(`Socket: User in room: ${socketId}`);
        });
      } else {
        console.log(`Socket: No users in room video-${videoId}`);
      }

      this.io.to(`video-${videoId}`).emit("comment-added", comment);
    } else {
      console.error("Socket: IO not initialized, cannot emit comment-added");
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
