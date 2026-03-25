import { Router } from "express";

import checkCache from "../middleware/checkCache.js";
import {
  getCachedProfile,
  getProfileSummary,
} from "../controllers/profileController.js";

const router = Router();

router.get("/:username/cached", getCachedProfile);
router.get("/:username", checkCache, getProfileSummary);

export default router;
