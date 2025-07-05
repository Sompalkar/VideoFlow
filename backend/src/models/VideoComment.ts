import mongoose, { type Document, Schema } from "mongoose"

export interface IVideoComment extends Document {
  videoId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  content: string
  timestamp?: number // Video timestamp in seconds
  parentId?: mongoose.Types.ObjectId // For replies
  mentions: mongoose.Types.ObjectId[] // Mentioned users
  reactions: Array<{
    userId: mongoose.Types.ObjectId
    type: "like" | "dislike" | "heart" | "laugh"
  }>
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const VideoCommentSchema = new Schema<IVideoComment>(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Number,
      min: 0,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "VideoComment",
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: ["like", "dislike", "heart", "laugh"],
          required: true,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
VideoCommentSchema.index({ videoId: 1, createdAt: -1 })
VideoCommentSchema.index({ userId: 1 })
VideoCommentSchema.index({ parentId: 1 })

export default mongoose.model<IVideoComment>("VideoComment", VideoCommentSchema)
