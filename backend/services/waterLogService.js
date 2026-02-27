import WaterLog from "../models/waterLog.js";
import ContaminationReport from "../models/contaminationReport.js";
import smsService from "./smsService.js"; // new SMS gateway helper

/**
 * Water Log Service - Handles business logic for water quality logs
 * Follows Single Responsibility Principle
 *
 * Auto-Validation Rules:
 * - pH Safe Range: 6.5 - 8.5 (Optimal for drinking water)
 * - Turbidity Safe Range: ≤ 5 NTU (Nephelometric Turbidity Units)
 */
class WaterLogService {
  /**
   * Calculate safety rating based on pH and turbidity levels
   * @param {number} phLevel - pH value (0-14)
   * @param {number} turbidity - Turbidity in NTU
   * @returns {string} Safety rating: 'Safe', 'Warning', or 'Unsafe'
   */
  calculateSafetyRating(phLevel, turbidity) {
    const isPhSafe = phLevel >= 6.5 && phLevel <= 8.5;
    const isTurbiditySafe = turbidity <= 5;

    // Safe: Both metrics are within safe ranges
    if (isPhSafe && isTurbiditySafe) {
      return "Safe";
    }

    // Unsafe: Either metric is severely outside safe range
    const isPhUnsafe = phLevel < 6.0 || phLevel > 9.0;
    const isTurbidityUnsafe = turbidity > 10;

    if (isPhUnsafe || isTurbidityUnsafe) {
      return "Unsafe";
    }

    // Warning: Slightly outside safe range
    return "Warning";
  }

  /**
   * Create a new water log with auto-validation and cross-model status sync
   * @param {object} logData - Log data including phLevel, turbidity, region, etc.
   * @returns {Promise<object>} Created water log with populated references
   * @throws {Error} If validation fails or sync operation fails
   */
  async createLog(logData) {
    try {
      // Auto-calculate safety rating
      const safetyRating = this.calculateSafetyRating(
        logData.phLevel,
        logData.turbidity
      );

      // Create log with calculated safety rating
      const log = new WaterLog({
        ...logData,
        safetyRating
      });

      // Save the log first
      await log.save();

      // Populate references for return data
      await log.populate("recordedBy", "firstName lastName email role");

      if (log.reportId) {
        await log.populate("reportId", "title status location");
      }

      // Cross-model status sync: Update Report status if reportId exists
      if (log.reportId) {
        await this.syncReportStatus(log.reportId, safetyRating);

        // --- SMS notification logic (non-blocking) ------------------------------
        try {
          // load report + reporter contact info
          const report = await ContaminationReport.findById(log.reportId)
            .populate("reportedBy", "firstName lastName phoneNumber");

          const reporter = report?.reportedBy;
          const location = report?.address || "specified location";

          if (reporter?.phoneNumber) {
            let smsMsg;
            const fullName = `${reporter.firstName || ""} ${reporter.lastName || ""}`.trim();

            if (safetyRating === "Safe") {
              smsMsg = `Hello ${fullName}, your water contamination report for ${location} has been Resolved. Testing confirms the water is now contamination-free!`;
            } else if (safetyRating === "Unsafe") {
              smsMsg = `Alert ${reporter.firstName || ""}: Your report for ${location} has been Verified. Testing confirms high contamination. Please avoid usage until further notice.`;
            }

            if (smsMsg) {
              try {
                await smsService.sendAlert(reporter.phoneNumber, smsMsg);
              } catch (smsError) {
                console.error("[SmsService] sendAlert failed:", smsError.message);
                // don't rethrow: SMS failure shouldn't prevent log creation
              }
            }
          }
        } catch (smsLookupError) {
          console.error("Failed to fetch report/recipient for SMS:", smsLookupError.message);
        }
      }

      return log;
    } catch (error) {
      throw new Error(`Failed to create water log: ${error.message}`);
    }
  }

  /**
   * Sync the associated contamination report status based on log's safety rating
   * Ensures data integrity through error handling
   *
   * @param {ObjectId} reportId - The report to update
   * @param {string} safetyRating - The calculated safety rating
   * @throws {Error} If sync operation fails
   */
  async syncReportStatus(reportId, safetyRating) {
    try {
      const report = await ContaminationReport.findById(reportId);

      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      // Update report status based on safety rating
      if (safetyRating === "Unsafe") {
        // Unsafe water quality → Status changes to 'Confirmed' (verified)
        report.status = "Confirmed";
      } else if (safetyRating === "Safe") {
        // Safe water quality → Status changes to 'Resolved'
        report.status = "Resolved";
      }
      // Warning status does not change the report status automatically

      await report.save();
    } catch (error) {
      // Log the error but don't throw to prevent blocking log creation
      console.error(`Failed to sync report status: ${error.message}`);
      throw new Error(`Failed to sync report status: ${error.message}`);
    }
  }

  /**
   * Retrieve all water logs with optional filtering
   * @param {object} filter - MongoDB query filter (optional)
   * @returns {Promise<Array>} Array of water logs
   * @throws {Error} If query fails
   */
  async getAllLogs(filter = {}) {
    try {
      const logs = await WaterLog.find(filter)
        .populate("recordedBy", "firstName lastName email role")
        .populate("reportId", "title status location")
        .sort({ recordedAt: -1 }); // Most recent first

      return logs;
    } catch (error) {
      throw new Error(`Failed to fetch water logs: ${error.message}`);
    }
  }

  /**
   * Retrieve a single log by ID
   * @param {string} logId - The log ID
   * @returns {Promise<object>} Water log document
   * @throws {Error} If log not found
   */
  async getLogById(logId) {
    try {
      const log = await WaterLog.findById(logId)
        .populate("recordedBy", "firstName lastName email role")
        .populate("reportId", "title status location");

      if (!log) {
        throw new Error("Water log not found");
      }

      return log;
    } catch (error) {
      throw new Error(`Failed to fetch water log: ${error.message}`);
    }
  }

  /**
   * Update an existing water log
   * IMPORTANT: Only admin users can update logs to protect scientific data integrity
   *
   * @param {string} logId - The log to update
   * @param {object} updateData - Partial update data
   * @returns {Promise<object>} Updated water log
   * @throws {Error} If log not found or update fails
   */
  async updateLog(logId, updateData) {
    try {
      const log = await WaterLog.findById(logId);

      if (!log) {
        throw new Error("Water log not found");
      }

      // Recalculate safety rating if pH or turbidity changed
      let safetyRating = log.safetyRating;
      if (updateData.phLevel !== undefined || updateData.turbidity !== undefined) {
        const phLevel = updateData.phLevel ?? log.phLevel;
        const turbidity = updateData.turbidity ?? log.turbidity;
        safetyRating = this.calculateSafetyRating(phLevel, turbidity);
      }

      // Update fields
      Object.assign(log, updateData, { safetyRating });

      // Save updated log
      await log.save();

      // Re-sync report status if safety rating changed
      if (log.reportId && updateData.phLevel !== undefined || updateData.turbidity !== undefined) {
        await this.syncReportStatus(log.reportId, safetyRating);
      }

      // Populate and return
      await log.populate("recordedBy", "firstName lastName email role");
      if (log.reportId) {
        await log.populate("reportId", "title status location");
      }

      return log;
    } catch (error) {
      throw new Error(`Failed to update water log: ${error.message}`);
    }
  }

  /**
   * Delete a water log
   * IMPORTANT: Only admin users can delete logs to protect scientific data integrity
   *
   * @param {string} logId - The log to delete
   * @throws {Error} If log not found or deletion fails
   */
  async deleteLog(logId) {
    try {
      const log = await WaterLog.findByIdAndDelete(logId);

      if (!log) {
        throw new Error("Water log not found");
      }

      return { message: "Water log deleted successfully", log };
    } catch (error) {
      throw new Error(`Failed to delete water log: ${error.message}`);
    }
  }

  /**
   * Get logs by region
   * @param {string} region - The region to filter by
   * @returns {Promise<Array>} Water logs for the region
   * @throws {Error} If query fails
   */
  async getLogsByRegion(region) {
    try {
      const logs = await WaterLog.find({ region })
        .populate("recordedBy", "firstName lastName email role")
        .populate("reportId", "title status location")
        .sort({ recordedAt: -1 });

      return logs;
    } catch (error) {
      throw new Error(`Failed to fetch logs for region ${region}: ${error.message}`);
    }
  }
}

export default new WaterLogService();
