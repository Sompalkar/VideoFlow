import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "creator" | "editor" | "manager";
  avatar?: string;
  teamId?: mongoose.Types.ObjectId;
  isActive: boolean;
  needsPasswordChange: boolean;
  youtubeTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  youtubeChannelId?: string;
  youtubeChannelName?: string;
  youtubeChannel?: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["creator", "editor", "manager"],
      default: "creator",
    },
    avatar: {
      type: String,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    needsPasswordChange: {
      type: Boolean,
      default: false,
    },
    youtubeTokens: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
    },
    youtubeChannelId: {
      type: String,
    },
    youtubeChannelName: {
      type: String,
    },
    youtubeChannel: {
      id: String,
      title: String,
      description: String,
      thumbnail: String,
      subscriberCount: Number,
      videoCount: Number,
      viewCount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ teamId: 1 });

export default mongoose.model<IUser>("User", userSchema);
