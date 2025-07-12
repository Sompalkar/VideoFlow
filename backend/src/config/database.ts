import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// // Handle connection events
// mongoose.connection.on("connected", () => {
//   console.log("📊 Mongoose connected to MongoDB")
// })

// mongoose.connection.on("error", (err) => {
//   console.error("❌ Mongoose connection error:", err)
// })

// mongoose.connection.on("disconnected", () => {
//   console.log("📊 Mongoose disconnected from MongoDB")
// })

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   await mongoose.connection.close()
//   console.log("📊 Mongoose connection closed through app termination")
//   process.exit(0)
// })
