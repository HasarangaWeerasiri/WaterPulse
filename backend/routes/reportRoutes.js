import express from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  getReportsByRadius,
  updateReport,
  updateReportStatus,
  deleteReport,
  downloadReportPdf,
  downloadAllReportsPdf,
  getMyReports,
  getConfirmedReports,
  getPendingReports,
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

// Download all reports as a single PDF (admin & authority)
router.get(
  "/all/pdf",
  verifyToken,
  checkRole(["admin", "authority"]),
  downloadAllReportsPdf
);

// Get my reports (citizen)
router.get(
  "/my-reports",
  verifyToken,
  checkRole(["citizen"]),
  getMyReports
);

// Get all confirmed reports (any authenticated user)
router.get(
  "/confirmed",
  verifyToken,
  getConfirmedReports
);

// Get all pending reports (admin & authority)
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

// Download a single report as PDF
router.get(
  "/:id/pdf",
  verifyToken,
  downloadReportPdf
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
