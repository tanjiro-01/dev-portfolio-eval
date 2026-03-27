import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDatabase } from "./src/config/db.js";
import { validateEnvironment } from "./src/config/env.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
