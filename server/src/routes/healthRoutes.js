import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    if (dbStatus !== 1) {
      return res.status(503).json({
        status: "error",
        message: "Database not connected",
        code: "DB_NOT_READY",
      });
    }

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

export default router;
