import { Router } from "express";

import checkCache from "../middleware/checkCache.js";
import { getProfileSummary } from "../controllers/profileController.js";

const router = Router();

router.get("/:username", checkCache, getProfileSummary);

export default router;
