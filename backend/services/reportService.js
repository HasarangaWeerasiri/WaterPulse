import ContaminationReport from '../models/contaminationReport.js';

/**
 * Report Service - Handles business logic for contamination reports
 * Follows Single Responsibility Principle
 */
class ReportService {
  /**
   * Get all pending reports (status: "Unverified")
   * @returns {Promise<Array>} Array of pending reports with populated user data
   */
  async getPendingReports() {
    try {
      const pendingReports = await ContaminationReport.find({ status: 'Unverified' })
        .populate('reportedBy', 'firstName lastName email phoneNumber location')
        .sort({ createdAt: -1 }); // Most recent first

      return pendingReports;
    } catch (error) {
      throw new Error(`Failed to fetch pending reports: ${error.message}`);
    }
  }

  /**
   * Get pending reports count
   * @returns {Promise<number>} Count of pending reports
   */
  async getPendingReportsCount() {
    try {
      const count = await ContaminationReport.countDocuments({ status: 'Unverified' });
      return count;
    } catch (error) {
      throw new Error(`Failed to count pending reports: ${error.message}`);
    }
  }
}

export default new ReportService();
