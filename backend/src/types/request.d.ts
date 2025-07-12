// Type definitions for request bodies
declare global {
  namespace Express {
    interface Request {
      body: {
        // AI Thumbnail Controller
        videoUrl?: string;
        title?: string;
        description?: string;
        style?: string;
        colors?: string[];
        text?: string;
        aspectRatio?: string;
        videoId?: string;
        thumbnailUrl?: string;
        brightness?: number;
        contrast?: number;
        saturation?: number;
        overlay?: boolean;
        frameUrl?: string;
        prompt?: string;
        strength?: number;
        guidanceScale?: number;
        service?: string;
        videoTitle?: string;
        videoDescription?: string;
        publicId?: string;
        fontFamily?: string;
        fontSize?: number;
        fontColor?: string;
        position?: string;
        background?: string;
        opacity?: number;
        width?: number;
        height?: number;
        apiKey?: string;

        // Auth Controller
        email?: string;
        password?: string;
        name?: string;
        role?: string;
        currentPassword?: string;
        newPassword?: string;
        avatar?: string;

        // Comment Controller
        content?: string;
        timestamp?: number;
        parentId?: string;
        mentions?: string[];
        type?: "like" | "dislike" | "heart" | "laugh";

        // Team Controller
        teamId?: string;
        memberId?: string;
        role?: "creator" | "editor" | "manager";
        status?: "active" | "pending" | "inactive";

        // Video Controller
        reason?: string;

        // YouTube Routes
        code?: string;
      };
    }
  }
}

export {};
