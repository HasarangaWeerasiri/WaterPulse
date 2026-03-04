import express from "express";
import {
  createSafeZone,
  getAllSafeZones,
  getNearbySafeZones,
  getSafeZoneById,
  getSafeZoneWeather,
  updateSafeZone,
  deleteSafeZone,
} from "../controllers/safeZoneController.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public Routes ────────────────────────────────────────────────────────────

// GET /api/safe-zones/all  →  list every safe zone (admin table / full map)
router.get("/all", getAllSafeZones);

// GET /api/safe-zones/nearby?lat=&lng=&maxDistance=&limit=
//   → 5 closest safe zones to the user's position
router.get("/nearby", getNearbySafeZones);

// GET /api/safe-zones/:id/weather  →  current weather + contamination risk
// ⚠️ Must be registered BEFORE /:id to avoid route conflict
router.get("/:id/weather", getSafeZoneWeather);

// GET /api/safe-zones/:id  →  single safe zone detail
router.get("/:id", getSafeZoneById);

// ── Protected Routes (Admin / Authority only) ────────────────────────────────

// POST /api/safe-zones  →  add a new clean water source
router.post(
  "/",
  verifyToken,
  checkRole(["admin", "authority"]),
  createSafeZone,
);

// PUT /api/safe-zones/:id  →  update details or flip isAvailable
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin", "authority"]),
  updateSafeZone,
);

// DELETE /api/safe-zones/:id  →  permanently remove a water source
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin", "authority"]),
  deleteSafeZone,
);

export default router;
