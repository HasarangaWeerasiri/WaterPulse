import waterLogService from "../services/waterLogService.js";

/**
 * Water Log Controller - Handles HTTP requests for water quality logs
 * All endpoints require JWT authentication
 */

/**
 * POST /api/logs
 * Create a new water quality log
 * Restriction: authority or admin roles only
 */
export const createLog = async (req, res) => {
  try {
    const { region, reportId, phLevel, turbidity, contaminants } = req.body;

    // Validate required fields
    if (!region || phLevel === undefined || turbidity === undefined) {
      return res.status(400).json({
        message: "region, phLevel, and turbidity are required"
      });
    }

    // Validate numeric values
    if (typeof phLevel !== "number" || typeof turbidity !== "number") {
      return res.status(400).json({
        message: "phLevel and turbidity must be numbers"
      });
    }

    // Validate pH range
    if (phLevel < 0 || phLevel > 14) {
      return res.status(400).json({
        message: "phLevel must be between 0 and 14"
      });
    }

    // Validate turbidity range
    if (turbidity < 0) {
      return res.status(400).json({
        message: "turbidity must be a non-negative number"
      });
    }

    // Create log object
    const logData = {
      region,
      phLevel,
      turbidity,
      recordedBy: req.userId,
      contaminants: contaminants || []
    };

    // Add reportId if provided
    if (reportId) {
      logData.reportId = reportId;
    }

    // Create log via service
    const log = await waterLogService.createLog(logData);

    res.status(201).json({
      message: "Water log created successfully",
      log
    });
  } catch (error) {
    console.error("Create log error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * GET /api/logs
 * Fetch all water logs
 * Restriction: All authenticated users
 */
export const getAllLogs = async (req, res) => {
  try {
    const { region, safetyRating } = req.query;

    // Build filter object
    const filter = {};
    if (region) {
      filter.region = region;
    }
    if (safetyRating) {
      filter.safetyRating = safetyRating;
    }

    // Fetch logs with optional filtering
    const logs = await waterLogService.getAllLogs(filter);

    res.status(200).json({
      message: "Water logs retrieved successfully",
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("Get logs error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/logs/:id
 * Fetch a specific water log by ID
 * Restriction: All authenticated users
 */
export const getLogById = async (req, res) => {
  try {
    const log = await waterLogService.getLogById(req.params.id);

    res.status(200).json({
      message: "Water log retrieved successfully",
      log
    });
  } catch (error) {
    console.error("Get log error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * PATCH /api/logs/:id
 * Update an existing water log
 * Restriction: admin only (to protect scientific data integrity)
 */
export const updateLog = async (req, res) => {
  try {
    const { phLevel, turbidity, contaminants, region } = req.body;

    // Validate at least one field is being updated
    if (!phLevel && !turbidity && !contaminants && !region) {
      return res.status(400).json({
        message: "At least one field (phLevel, turbidity, contaminants, or region) is required"
      });
    }

    // Validate numeric values if provided
    if (phLevel !== undefined && (typeof phLevel !== "number" || phLevel < 0 || phLevel > 14)) {
      return res.status(400).json({
        message: "phLevel must be a number between 0 and 14"
      });
    }

    if (turbidity !== undefined && (typeof turbidity !== "number" || turbidity < 0)) {
      return res.status(400).json({
        message: "turbidity must be a non-negative number"
      });
    }

    // Build update object
    const updateData = {};
    if (phLevel !== undefined) updateData.phLevel = phLevel;
    if (turbidity !== undefined) updateData.turbidity = turbidity;
    if (contaminants !== undefined) updateData.contaminants = contaminants;
    if (region !== undefined) updateData.region = region;

    // Update log via service
    const log = await waterLogService.updateLog(req.params.id, updateData);

    res.status(200).json({
      message: "Water log updated successfully",
      log
    });
  } catch (error) {
    console.error("Update log error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * DELETE /api/logs/:id
 * Delete a water log
 * Restriction: admin only (to protect scientific data integrity)
 */
export const deleteLog = async (req, res) => {
  try {
    const result = await waterLogService.deleteLog(req.params.id);

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete log error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * GET /api/logs/analytics/trends
 * Get water quality trends with MongoDB aggregation
 * Returns: Monthly safety trends per region
 * Restriction: All authenticated users
 */
export const getAnalyticsTrends = async (req, res) => {
  try {
    const { region, months = 12 } = req.query;

    // Calculate date range (past N months)
    const monthsNum = Math.min(Math.max(parseInt(months) || 12, 1), 24);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          recordedAt: { $gte: startDate }
        }
      }
    ];

    // Filter by region if provided
    if (region) {
      pipeline[0].$match.region = region;
    }

    // Group by month and region
    pipeline.push(
      {
        $group: {
          _id: {
            region: "$region",
            month: {
              $dateToString: { format: "%Y-%m", date: "$recordedAt" }
            }
          },
          avgPH: { $avg: "$phLevel" },
          avgTurbidity: { $avg: "$turbidity" },
          safeCount: {
            $sum: { $cond: [{ $eq: ["$safetyRating", "Safe"] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ["$safetyRating", "Warning"] }, 1, 0] }
          },
          unsafeCount: {
            $sum: { $cond: [{ $eq: ["$safetyRating", "Unsafe"] }, 1, 0] }
          },
          totalCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    );

    // Execute aggregation
    const WaterLog = require("../models/waterLog.js").default;
    const trends = await WaterLog.aggregate(pipeline);

    res.status(200).json({
      message: "Analytics trends retrieved successfully",
      filters: {
        region: region || "all",
        months: monthsNum
      },
      data: trends
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/logs/region/:region
 * Get all logs for a specific region
 * Restriction: All authenticated users
 */
export const getLogsByRegion = async (req, res) => {
  try {
    const logs = await waterLogService.getLogsByRegion(req.params.region);

    res.status(200).json({
      message: "Water logs for region retrieved successfully",
      region: req.params.region,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("Get logs by region error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
