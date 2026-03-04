import WaterLog from "../models/waterLog.js";

/**
 * Analytics Service - Handles MongoDB aggregation for water quality insights
 * Provides analytics dashboards and trend analysis
 */
class AnalyticsService {
  /**
   * Get monthly trends for a specific region or all regions
   * @param {string|null} region - Region to filter by (null for all)
   * @param {number} months - Number of months to include (1-24)
   * @returns {Promise<Array>} Monthly trend data with safety metrics
   */
  async getTrendsByRegion(region = null, months = 12) {
    try {
      const monthsNum = Math.min(Math.max(months, 1), 24);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsNum);

      const pipeline = [
        {
          $match: {
            recordedAt: { $gte: startDate }
          }
        }
      ];

      if (region) {
        pipeline[0].$match.region = region;
      }

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
            minPH: { $min: "$phLevel" },
            maxPH: { $max: "$phLevel" },
            avgTurbidity: { $avg: "$turbidity" },
            minTurbidity: { $min: "$turbidity" },
            maxTurbidity: { $max: "$turbidity" },
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
          $addFields: {
            safePercentage: {
              $round: [
                { $multiply: [{ $divide: ["$safeCount", "$totalCount"] }, 100] },
                2
              ]
            },
            warningPercentage: {
              $round: [
                { $multiply: [{ $divide: ["$warningCount", "$totalCount"] }, 100] },
                2
              ]
            },
            unsafePercentage: {
              $round: [
                { $multiply: [{ $divide: ["$unsafeCount", "$totalCount"] }, 100] },
                2
              ]
            }
          }
        },
        {
          $sort: { "_id.month": 1 }
        }
      );

      const trends = await WaterLog.aggregate(pipeline);
      return trends;
    } catch (error) {
      throw new Error(`Failed to get trends: ${error.message}`);
    }
  }

  /**
   * Get overall metrics per region (latest summary)
   * @returns {Promise<Array>} Summary metrics for each region
   */
  async getRegionalMetrics() {
    try {
      const pipeline = [
        {
          $group: {
            _id: "$region",
            avgPH: { $avg: "$phLevel" },
            minPH: { $min: "$phLevel" },
            maxPH: { $max: "$phLevel" },
            avgTurbidity: { $avg: "$turbidity" },
            minTurbidity: { $min: "$turbidity" },
            maxTurbidity: { $max: "$turbidity" },
            safeCount: {
              $sum: { $cond: [{ $eq: ["$safetyRating", "Safe"] }, 1, 0] }
            },
            warningCount: {
              $sum: { $cond: [{ $eq: ["$safetyRating", "Warning"] }, 1, 0] }
            },
            unsafeCount: {
              $sum: { $cond: [{ $eq: ["$safetyRating", "Unsafe"] }, 1, 0] }
            },
            totalCount: { $sum: 1 },
            latestRecordedAt: { $max: "$recordedAt" }
          }
        },
        {
          $addFields: {
            safePercentage: {
              $round: [
                { $multiply: [{ $divide: ["$safeCount", "$totalCount"] }, 100] },
                2
              ]
            },
            warningPercentage: {
              $round: [
                { $multiply: [{ $divide: ["$warningCount", "$totalCount"] }, 100] },
                2
              ]
            },
            unsafePercentage: {
              $round: [
                { $multiply: [{ $divide: ["$unsafeCount", "$totalCount"] }, 100] },
                2
              ]
            }
          }
        },
        {
          $sort: { "totalCount": -1 }
        }
      ];

      const metrics = await WaterLog.aggregate(pipeline);
      return metrics;
    } catch (error) {
      throw new Error(`Failed to get regional metrics: ${error.message}`);
    }
  }

  /**
   * Get safety rating distribution (overall health snapshot)
   * @returns {Promise<object>} Distribution of safety ratings
   */
  async getSafetyDistribution() {
    try {
      const pipeline = [
        {
          $group: {
            _id: "$safetyRating",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ];

      const distribution = await WaterLog.aggregate(pipeline);

      const total = distribution.reduce((sum, item) => sum + item.count, 0);

      const formatted = {
        total,
        distribution: distribution.map(item => ({
          rating: item._id,
          count: item.count,
          percentage: total > 0 ? ((item.count / total) * 100).toFixed(2) : 0
        }))
      };

      return formatted;
    } catch (error) {
      throw new Error(`Failed to get safety distribution: ${error.message}`);
    }
  }

  /**
   * Compare metrics between regions
   * @param {Array<string>} regions - List of regions to compare
   * @param {number} months - Number of months for comparison
   * @returns {Promise<object>} Comparative analysis
   */
  async compareRegions(regions, months = 12) {
    try {
      const monthsNum = Math.min(Math.max(months, 1), 24);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsNum);

      const pipeline = [
        {
          $match: {
            region: { $in: regions },
            recordedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$region",
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
          $addFields: {
            safePercentage: {
              $round: [
                { $multiply: [{ $divide: ["$safeCount", "$totalCount"] }, 100] },
                2
              ]
            }
          }
        },
        {
          $sort: { "safePercentage": -1 }
        }
      ];

      const comparison = await WaterLog.aggregate(pipeline);
      return comparison;
    } catch (error) {
      throw new Error(`Failed to compare regions: ${error.message}`);
    }
  }

  /**
   * Get the latest readings for each region
   * @returns {Promise<Array>} Most recent log per region
   */
  async getLatestReadings() {
    try {
      const pipeline = [
        {
          $sort: { region: 1, recordedAt: -1 }
        },
        {
          $group: {
            _id: "$region",
            latestReading: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$latestReading" }
        },
        {
          $lookup: {
            from: "users",
            localField: "recordedBy",
            foreignField: "_id",
            as: "recordedByUser"
          }
        },
        {
          $unwind: {
            path: "$recordedByUser",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            region: 1,
            phLevel: 1,
            turbidity: 1,
            safetyRating: 1,
            recordedAt: 1,
            recordedByName: "$recordedByUser.firstName"
          }
        },
        {
          $sort: { recordedAt: -1 }
        }
      ];

      const readings = await WaterLog.aggregate(pipeline);
      return readings;
    } catch (error) {
      throw new Error(`Failed to get latest readings: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
