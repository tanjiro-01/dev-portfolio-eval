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
      process.stdout.write(`Server running on port ${PORT}\n`);
    });
  } catch (error) {
    process.stderr.write(`Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
