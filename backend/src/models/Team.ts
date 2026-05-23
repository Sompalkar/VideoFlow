import mongoose, { type Document, Schema } from "mongoose";

export interface ITeam extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: "creator" | "editor" | "manager";
    joinedAt: Date;
    status: "active" | "pending" | "inactive";
  }>;
  description?: string;
  settings: {
    autoApprove: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
    requireApproval: boolean;
  };
  subscription: {
    plan: "starter" | "professional" | "enterprise";
    status: "active" | "cancelled" | "expired";
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["creator", "editor", "manager"],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "pending", "inactive"],
          default: "active",
        },
      },
    ],
    settings: {
      autoApprove: {
        type: Boolean,
        default: false,
      },
      allowedFileTypes: [
        {
          type: String,
          default: ["mp4", "mov", "avi", "mkv"],
        },
      ],
      maxFileSize: {
        type: Number,
        default: 2147483648, // 2GB in bytes
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["starter", "professional", "enterprise"],
        default: "starter",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "expired"],
        default: "active",
      },
      expiresAt: {
        type: Date,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ "members.userId": 1 });

export default mongoose.model<ITeam>("Team", TeamSchema);
