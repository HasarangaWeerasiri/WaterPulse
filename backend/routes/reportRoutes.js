import express from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  getReportsByRadius,
  updateReport,
  updateReportStatus,
  deleteReport,
  getMyReports,
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

// Get my reports (citizen)
router.get(
  "/my-reports",
  verifyToken,
  checkRole(["citizen"]),
  getMyReports
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
// Update full report details (title, description, location, image)
router.put(
  "/:id",
  verifyToken,
  updateReport
);

// Update report status only
router.put(
  "/:id/status",
  verifyToken,
  updateReportStatus
);

// Delete a report (citizen: own only, admin/authority: any)
router.delete(
  "/:id",
  verifyToken,
  deleteReport
);

export default router;
