import mongoose from "mongoose";

import Report from "../models/Report.js";
import { CURRENT_REPORT_VERSION } from "../config/reportCache.js";

const checkCache = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next();
    }

    const username = req.params.username?.toLowerCase();
    if (!username) {
      return next();
    }

    const cached = await Report.findOne({ username }).lean();
    if (!cached) {
      return next();
    }

    if (cached.report?.reportVersion !== CURRENT_REPORT_VERSION) {
      return next();
    }

    return res.status(200).json({
      ...cached.report,
      heatmapData: cached.report.heatmapData || [],
      cache: {
        hit: true,
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default checkCache;
