import cors from "cors";
import express from "express";

import compareRoutes from "./routes/compareRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server and curl requests with no Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedRequestOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedRequestOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/profile", profileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
