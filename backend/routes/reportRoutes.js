import express from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  getReportsByRadius,
  updateReportStatus,
  deleteReport,
  getPendingReports
} from "../controllers/reportController.js";

import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new contamination report (citizen)
router.post(
  "/",
  verifyToken,
  checkRole(["citizen"]),
  createReport
);

// Get all reports (admin & authority)
router.get(
  "/all",
  verifyToken,
  checkRole(["admin", "authority"]),
  getAllReports
);

// Get pending reports (admin & authority)
router.get(
  "/pending",
  verifyToken,
  checkRole(["admin", "authority"]),
  getPendingReports
);

// Get a single report by ID (any authenticated user, but citizens only see their own)
router.get(
  "/:id",
  verifyToken,
  getReportById
);

// Get reports within a radius (for map view)
router.get(
  "/",
  verifyToken,
  getReportsByRadius
);

// Update report status
router.put(
  "/:id",
  verifyToken,
  updateReportStatus
);

// Delete a report (admin only)
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  deleteReport
);

export default router;
