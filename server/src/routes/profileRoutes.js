import { Router } from "express";

import checkCache from "../middleware/checkCache.js";

const router = Router();

router.get("/:username", checkCache, async (req, res) => {
  return res.status(503).json({
    message: "Profile generation is not implemented yet. Cache miss.",
    username: req.params.username,
  });
});

export default router;
