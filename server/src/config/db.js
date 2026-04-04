import mongoose from "mongoose";

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    process.stderr.write(
      "MONGODB_URI is not set. Running without database cache.\n",
    );
    return false;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  process.stdout.write("MongoDB connected\n");
  return true;
};
