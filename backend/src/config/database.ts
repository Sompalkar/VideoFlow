import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI environment variable is required. Please set it in your .env file."
      );
    }

    await mongoose.connect(mongoURI);

    /* console log removed */
  } catch (error) {
    /* console log removed */
    process.exit(1);
  }
};
