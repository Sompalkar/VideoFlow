import mongoose, { type Document, Schema } from "mongoose"

export interface IVideo extends Document {
  title: string
  description: string
  tags: string[]
  thumbnail: string
  cloudinaryVideoId: string
  cloudinaryVideoUrl: string
  cloudinaryThumbnailId?: string
  cloudinaryThumbnailUrl: string
  fileSize: number
  duration: number
  category: string
  privacy: string
  status: "uploading" | "pending" | "approved" | "rejected" | "published"
  uploadedBy: mongoose.Types.ObjectId
  uploadedAt: Date
  approvedBy?: mongoose.Types.ObjectId
  approvedAt?: Date
  rejectedBy?: mongoose.Types.ObjectId
  rejectedAt?: Date
  rejectionReason?: string
  youtubeId?: string
  youtubeUrl?: string
  teamId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const VideoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    thumbnail: {
      type: String,
      required: true,
    },
    cloudinaryVideoId: {
      type: String,
      required: true,
    },
    cloudinaryVideoUrl: {
      type: String,
      required: true,
    },
    cloudinaryThumbnailId: {
      type: String,
    },
    cloudinaryThumbnailUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "22", // People & Blogs
    },
    privacy: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    status: {
      type: String,
      enum: ["uploading", "pending", "approved", "rejected", "published"],
      default: "pending",
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    youtubeId: {
      type: String,
    },
    youtubeUrl: {
      type: String,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
VideoSchema.index({ teamId: 1, status: 1 })
VideoSchema.index({ uploadedBy: 1 })
VideoSchema.index({ createdAt: -1 })
VideoSchema.index({ cloudinaryVideoId: 1 })

export default mongoose.model<IVideo>("Video", VideoSchema)
