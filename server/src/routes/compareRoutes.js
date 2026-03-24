import { Router } from "express";

import { compareProfiles } from "../controllers/profileController.js";

const router = Router();

router.get("/", compareProfiles);

export default router;
