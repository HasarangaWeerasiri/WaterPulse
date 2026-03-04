import express from "express";
import {
  createLog,
  getAllLogs,
  getLogById,
  updateLog,
  deleteLog,
  getAnalyticsTrends,
  getLogsByRegion
} from "../controllers/waterLogController.js";

import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Public Routes (All Authenticated Users) ───

/**
 * GET /api/logs/analytics/trends
 * Fetch water quality trends with aggregation
 * Returns: Monthly safety metrics per region
 * Query params: region (optional), months (optional, default: 12)
 */
router.get(
  "/analytics/trends",
  verifyToken,
  getAnalyticsTrends
);

/**
 * GET /api/logs
 * Fetch all water quality logs
 * Query params: region (optional), safetyRating (optional)
 */
router.get(
  "/",
  verifyToken,
  getAllLogs
);

/**
 * GET /api/logs/region/:region
 * Fetch all logs for a specific region
 */
router.get(
  "/region/:region",
  verifyToken,
  getLogsByRegion
);

/**
 * GET /api/logs/:id
 * Fetch a specific water log by ID
 */
router.get(
  "/:id",
  verifyToken,
  getLogById
);

// ─── Protected Routes (Authority/Admin Only) ───

/**
 * POST /api/logs
 * Create a new water quality log
 * Restriction: authority or admin roles only
 * Body: { region, phLevel, turbidity, contaminants?, reportId? }
 */
router.post(
  "/",
  verifyToken,
  checkRole(["authority", "admin"]),
  createLog
);

// ─── Admin Only Routes ───

/**
 * PATCH /api/logs/:id
 * Update an existing water log
 * Restriction: admin only (to protect scientific data integrity)
 * Body: { phLevel?, turbidity?, contaminants?, region? }
 */
router.patch(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  updateLog
);

/**
 * DELETE /api/logs/:id
 * Delete a water log
 * Restriction: admin only (to protect scientific data integrity)
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  deleteLog
);

export default router;
