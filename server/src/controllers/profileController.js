import { createHttpError } from "../utils/httpError.js";
import {
  computeCompareWinners,
  getCachedReport,
  getOrBuildReport,
} from "../services/reportService.js";

export const getProfileSummary = async (req, res, next) => {
  try {
    const username = req.params.username?.toLowerCase();
    const { report } = await getOrBuildReport(username);

    res.set("Cache-Control", "public, max-age=3600");
    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

export const getCachedProfile = async (req, res, next) => {
  try {
    const username = req.params.username?.toLowerCase();
    const cached = await getCachedReport(username);

    if (!cached) {
      throw createHttpError(404, `No cached report found for ${username}`);
    }

    return res.status(200).json({
      ...cached.report,
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

export const compareProfiles = async (req, res, next) => {
  try {
    const left = req.query.u1?.toLowerCase();
    const right = req.query.u2?.toLowerCase();

    if (!left || !right) {
      throw createHttpError(
        400,
        "Both u1 and u2 query parameters are required.",
      );
    }

    if (left === right) {
      throw createHttpError(400, "u1 and u2 must be different usernames.");
    }

    const [leftResult, rightResult] = await Promise.all([
      getOrBuildReport(left),
      getOrBuildReport(right),
    ]);

    return res.status(200).json({
      users: [leftResult.report, rightResult.report],
      winners: computeCompareWinners(leftResult.report, rightResult.report),
    });
  } catch (error) {
    return next(error);
  }
};
