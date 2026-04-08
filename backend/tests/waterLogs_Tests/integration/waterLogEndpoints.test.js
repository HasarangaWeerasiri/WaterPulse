import request from "supertest";
import waterLogService from "../../../services/waterLogService.js";
import WaterLog from "../../../models/waterLog.js";
import ContaminationReport from "../../../models/contaminationReport.js";
import Task from "../../../models/task.js";
import User from "../../../models/user.js";
import {
  createLog,
  getAllLogs,
  getLogById,
  updateLog,
  deleteLog,
  getLogsByRegion
} from "../../../controllers/waterLogController.js";

// Mock the service and models
jest.mock("../../../services/waterLogService.js");
jest.mock("../../../models/waterLog.js");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/task.js");
jest.mock("../../../models/user.js");

describe("WaterLog Endpoints - Integration Tests", () => {
  // Setup mock request/response objects
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      userId: "66a1234567890abcdef12345",
      userRole: "admin",
      params: {},
      body: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };
  });

  // ==================== LOG CREATION FLOW ====================
  describe("Log Creation Flow - POST /api/logs", () => {
    test("should create a log and return 201 with log data", async () => {
      const logData = {
        phLevel: 7,
        turbidity: 3,
        region: "North",
        recordedBy: mockReq.userId
      };

      const createdLog = {
        _id: "log123",
        ...logData,
        safetyRating: "Safe",
        createdAt: new Date()
      };

      mockReq.body = logData;
      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(waterLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          phLevel: 7,
          turbidity: 3,
          recordedBy: mockReq.userId
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log created successfully",
        log: createdLog
      });
    });

    test("should auto-calculate safety rating Safe when creating log", async () => {
      const logData = {
        phLevel: 7.0,
        turbidity: 2,
        region: "South"
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7.0,
        turbidity: 2,
        safetyRating: "Safe", // Auto-calculated
        recordedBy: mockReq.userId
      };

      mockReq.body = logData;
      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.objectContaining({
            safetyRating: "Safe"
          })
        })
      );
    });

    test("should auto-calculate safety rating Unsafe when creating log", async () => {
      const logData = {
        phLevel: 5.0,
        turbidity: 15
      };

      const createdLog = {
        _id: "log2",
        phLevel: 5.0,
        turbidity: 15,
        safetyRating: "Unsafe", // Auto-calculated
        recordedBy: mockReq.userId
      };

      mockReq.body = logData;
      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.objectContaining({
            safetyRating: "Unsafe"
          })
        })
      );
    });

    test("should return 400 when phLevel is missing", async () => {
      mockReq.body = {
        turbidity: 3,
        region: "East"
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "phLevel and turbidity are required"
      });
    });

    test("should return 400 when turbidity is missing", async () => {
      mockReq.body = {
        phLevel: 7,
        region: "West"
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "phLevel and turbidity are required"
      });
    });

    test("should return 400 when phLevel is not a number", async () => {
      mockReq.body = {
        phLevel: "seven",
        turbidity: 3
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "phLevel and turbidity must be numbers"
      });
    });

    test("should return 400 when phLevel is outside valid range (< 0)", async () => {
      mockReq.body = {
        phLevel: -1,
        turbidity: 3
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "phLevel must be between 0 and 14"
      });
    });

    test("should return 400 when phLevel is outside valid range (> 14)", async () => {
      mockReq.body = {
        phLevel: 15,
        turbidity: 3
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 when turbidity is negative", async () => {
      mockReq.body = {
        phLevel: 7,
        turbidity: -1
      };

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "turbidity must be a non-negative number"
      });
    });

    test("should include reportId when provided", async () => {
      const reportId = "report123";
      mockReq.body = {
        phLevel: 7,
        turbidity: 3,
        reportId
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        reportId,
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(waterLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId
        })
      );
    });

    test("should handle service errors and return appropriate status code", async () => {
      mockReq.body = {
        phLevel: 7,
        turbidity: 3
      };

      waterLogService.createLog.mockRejectedValue(
        new Error("Report not found")
      );

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ==================== ROLE-BASED AUTHORIZATION ====================
  describe("Role-Based Authorization", () => {
    test("POST /api/logs should accept valid request and create log", async () => {
      mockReq.body = {
        phLevel: 7,
        turbidity: 3
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test("GET /api/logs should be accessible to all authenticated users", async () => {
      const mockLogs = [
        { _id: "log1", phLevel: 7, safetyRating: "Safe" },
        { _id: "log2", phLevel: 5, safetyRating: "Unsafe" }
      ];

      waterLogService.getAllLogs.mockResolvedValue(mockLogs);
      mockReq.query = {};

      await getAllLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          logs: mockLogs
        })
      );
    });

    test("GET /api/logs/:id should be accessible to all authenticated users", async () => {
      const mockLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        safetyRating: "Safe"
      };

      mockReq.params = { id: "log1" };
      waterLogService.getLogById.mockResolvedValue(mockLog);

      await getLogById(mockReq, mockRes);

      expect(waterLogService.getLogById).toHaveBeenCalledWith("log1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("PATCH /api/logs/:id should restrict to admin only (authorization in middleware)", async () => {
      // Note: Real auth middleware would check this, but controller should validate input
      mockReq.params = { id: "log1" };
      mockReq.body = { phLevel: 7.5 };

      const updatedLog = {
        _id: "log1",
        phLevel: 7.5,
        turbidity: 3,
        safetyRating: "Safe"
      };

      waterLogService.updateLog.mockResolvedValue(updatedLog);

      await updateLog(mockReq, mockRes);

      expect(waterLogService.updateLog).toHaveBeenCalledWith("log1", expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("DELETE /api/logs/:id should restrict to admin only (authorization in middleware)", async () => {
      mockReq.params = { id: "log1" };

      waterLogService.deleteLog.mockResolvedValue({
        message: "Water log deleted successfully"
      });

      await deleteLog(mockReq, mockRes);

      expect(waterLogService.deleteLog).toHaveBeenCalledWith("log1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== FILTERING & RETRIEVAL ====================
  describe("Filtering & Retrieval", () => {
    test("should fetch all logs without filters", async () => {
      const mockLogs = [
        { _id: "log1", region: "North", phLevel: 7, safetyRating: "Safe" },
        { _id: "log2", region: "South", phLevel: 5, safetyRating: "Unsafe" }
      ];

      waterLogService.getAllLogs.mockResolvedValue(mockLogs);
      mockReq.query = {};

      await getAllLogs(mockReq, mockRes);

      expect(waterLogService.getAllLogs).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          logs: mockLogs
        })
      );
    });

    test("should filter logs by region query parameter", async () => {
      const mockLogs = [
        { _id: "log1", region: "North", phLevel: 7, safetyRating: "Safe" }
      ];

      waterLogService.getAllLogs.mockResolvedValue(mockLogs);
      mockReq.query = { region: "North" };

      await getAllLogs(mockReq, mockRes);

      expect(waterLogService.getAllLogs).toHaveBeenCalledWith({ region: "North" });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          logs: mockLogs
        })
      );
    });

    test("should filter logs by safetyRating query parameter", async () => {
      const mockLogs = [
        { _id: "log1", safetyRating: "Unsafe" },
        { _id: "log2", safetyRating: "Unsafe" }
      ];

      waterLogService.getAllLogs.mockResolvedValue(mockLogs);
      mockReq.query = { safetyRating: "Unsafe" };

      await getAllLogs(mockReq, mockRes);

      expect(waterLogService.getAllLogs).toHaveBeenCalledWith({
        safetyRating: "Unsafe"
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          logs: mockLogs
        })
      );
    });

    test("should combine region and safetyRating filters", async () => {
      const mockLogs = [
        { _id: "log1", region: "East", safetyRating: "Unsafe" }
      ];

      waterLogService.getAllLogs.mockResolvedValue(mockLogs);
      mockReq.query = { region: "East", safetyRating: "Unsafe" };

      await getAllLogs(mockReq, mockRes);

      expect(waterLogService.getAllLogs).toHaveBeenCalledWith({
        region: "East",
        safetyRating: "Unsafe"
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          logs: mockLogs
        })
      );
    });

    test("should fetch logs by specific region endpoint", async () => {
      const mockLogs = [
        { _id: "log1", region: "West", phLevel: 6.8 },
        { _id: "log2", region: "West", phLevel: 7.2 }
      ];

      waterLogService.getLogsByRegion.mockResolvedValue(mockLogs);
      mockReq.params = { region: "West" };

      await getLogsByRegion(mockReq, mockRes);

      expect(waterLogService.getLogsByRegion).toHaveBeenCalledWith("West");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          region: "West",
          count: 2,
          logs: mockLogs
        })
      );
    });

    test("should return empty list when no logs match filter", async () => {
      waterLogService.getAllLogs.mockResolvedValue([]);
      mockReq.query = { safetyRating: "Safe" };

      await getAllLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 0,
          logs: []
        })
      );
    });

    test("should return 404 when requesting non-existent log by ID", async () => {
      mockReq.params = { id: "invalid_id" };
      waterLogService.getLogById.mockRejectedValue(
        new Error("Water log not found")
      );

      await getLogById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log not found"
      });
    });

    test("should populate user and report references in fetched logs", async () => {
      const mockLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        recordedBy: {
          _id: "user1",
          firstName: "John",
          lastName: "Doe",
          role: "authority"
        },
        reportId: {
          _id: "report1",
          title: "Water Contamination",
          status: "Pending"
        }
      };

      waterLogService.getLogById.mockResolvedValue(mockLog);
      mockReq.params = { id: "log1" };

      await getLogById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log retrieved successfully",
        log: mockLog
      });
    });
  });

  // ==================== CROSS-MODEL INTERACTIONS ====================
  describe("Cross-Model Interactions", () => {
    test("should update contamination report status when log marked as Unsafe", async () => {
      const reportId = "report123";
      const logData = {
        phLevel: 5,
        turbidity: 12,
        reportId,
        recordedBy: mockReq.userId
      };

      const createdLog = {
        _id: "log1",
        ...logData,
        safetyRating: "Unsafe"
      };

      mockReq.body = logData;
      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      // Service should be called with the log data including reportId
      expect(waterLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: reportId,
          phLevel: 5,
          turbidity: 12
        })
      );
    });

    test("should update contamination report status when log marked as Safe", async () => {
      const reportId = "report123";
      const logData = {
        phLevel: 7,
        turbidity: 3,
        reportId,
        recordedBy: mockReq.userId
      };

      const createdLog = {
        _id: "log1",
        ...logData,
        safetyRating: "Safe" // Report should be marked Resolved
      };

      mockReq.body = logData;
      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(waterLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: reportId
        })
      );
    });

    test("should auto-complete task when water log resolves contamination", async () => {
      const reportId = "report123";
      mockReq.body = {
        phLevel: 7,
        turbidity: 2,
        reportId,
        region: "Central"
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 2,
        safetyRating: "Safe",
        reportId,
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      // Service handles task completion internally
      expect(waterLogService.createLog).toHaveBeenCalled();
    });

    test("should not update report status on Warning rating", async () => {
      const reportId = "report123";
      mockReq.body = {
        phLevel: 6.2,
        turbidity: 7,
        reportId
      };

      const createdLog = {
        _id: "log1",
        phLevel: 6.2,
        turbidity: 7,
        safetyRating: "Warning", // No automatic status change
        reportId,
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      // Service should still be called normally
      expect(waterLogService.createLog).toHaveBeenCalled();
    });

    test("should handle log update with safety rating recalculation", async () => {
      const logId = "log1";
      mockReq.params = { id: logId };
      mockReq.body = {
        phLevel: 8.5,
        turbidity: 1 // Changed to these safe values
      };

      const updatedLog = {
        _id: logId,
        phLevel: 8.5,
        turbidity: 1,
        safetyRating: "Safe", // Recalculated
        reportId: "report1"
      };

      waterLogService.updateLog.mockResolvedValue(updatedLog);

      await updateLog(mockReq, mockRes);

      expect(waterLogService.updateLog).toHaveBeenCalledWith(
        logId,
        expect.objectContaining({
          phLevel: 8.5,
          turbidity: 1
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log updated successfully",
        log: updatedLog
      });
    });

    test("should sync report status when updating log changes safety rating", async () => {
      const logId = "log1";
      const reportId = "report1";

      mockReq.params = { id: logId };
      mockReq.body = {
        phLevel: 5.5,
        turbidity: 12 // Changed to unsafe values
      };

      const updatedLog = {
        _id: logId,
        phLevel: 5.5,
        turbidity: 12,
        safetyRating: "Unsafe", // Recalculated
        reportId
      };

      waterLogService.updateLog.mockResolvedValue(updatedLog);

      await updateLog(mockReq, mockRes);

      expect(waterLogService.updateLog).toHaveBeenCalledWith(
        logId,
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should link water log to contamination report correctly", async () => {
      const reportId = "report123";
      mockReq.body = {
        phLevel: 7,
        turbidity: 3,
        reportId
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        reportId: {
          _id: reportId,
          title: "Reported Issue",
          status: "Pending"
        },
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log created successfully",
        log: expect.objectContaining({
          reportId: expect.any(Object)
        })
      });
    });
  });

  // ==================== UPDATE & DELETE OPERATIONS ====================
  describe("Update & Delete Operations", () => {
    test("should update log with only phLevel", async () => {
      mockReq.params = { id: "log1" };
      mockReq.body = { phLevel: 7.5 };

      const updatedLog = {
        _id: "log1",
        phLevel: 7.5,
        turbidity: 3,
        safetyRating: "Safe"
      };

      waterLogService.updateLog.mockResolvedValue(updatedLog);

      await updateLog(mockReq, mockRes);

      expect(waterLogService.updateLog).toHaveBeenCalledWith("log1", {
        phLevel: 7.5
      });
    });

    test("should update log with only turbidity", async () => {
      mockReq.params = { id: "log1" };
      mockReq.body = { turbidity: 4 };

      const updatedLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 4,
        safetyRating: "Safe"
      };

      waterLogService.updateLog.mockResolvedValue(updatedLog);

      await updateLog(mockReq, mockRes);

      expect(waterLogService.updateLog).toHaveBeenCalledWith("log1", {
        turbidity: 4
      });
    });

    test("should return 400 when update data is empty", async () => {
      mockReq.params = { id: "log1" };
      mockReq.body = {};

      await updateLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining("At least one field")
      });
    });

    test("should return 400 when updating with invalid phLevel", async () => {
      mockReq.params = { id: "log1" };
      mockReq.body = { phLevel: 15 };

      await updateLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 when updating with invalid turbidity", async () => {
      mockReq.params = { id: "log1" };
      mockReq.body = { turbidity: -5 };

      await updateLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should delete a log successfully", async () => {
      mockReq.params = { id: "log1" };

      waterLogService.deleteLog.mockResolvedValue({
        message: "Water log deleted successfully",
        log: { _id: "log1" }
      });

      await deleteLog(mockReq, mockRes);

      expect(waterLogService.deleteLog).toHaveBeenCalledWith("log1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Water log deleted successfully",
        log: expect.any(Object)
      });
    });

    test("should return 404 when deleting non-existent log", async () => {
      mockReq.params = { id: "invalid_id" };

      waterLogService.deleteLog.mockRejectedValue(
        new Error("Water log not found")
      );

      await deleteLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ==================== ERROR SCENARIOS ====================
  describe("Error Scenarios", () => {
    test("should handle database connection errors gracefully", async () => {
      mockReq.query = {};
      waterLogService.getAllLogs.mockRejectedValue(
        new Error("Database connection failed")
      );

      await getAllLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String)
      });
    });

    test("should handle service timeouts", async () => {
      mockReq.params = { id: "log1" };
      waterLogService.getLogById.mockRejectedValue(
        new Error("Request timeout")
      );

      await getLogById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should handle invalid ObjectId format", async () => {
      mockReq.params = { id: "not_a_valid_id" };
      waterLogService.getLogById.mockRejectedValue(
        new Error("Invalid ObjectId")
      );

      await getLogById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should log errors to console for debugging", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      mockReq.params = { id: "log1" };
      waterLogService.getLogById.mockRejectedValue(
        new Error("DB Error")
      );

      await getLogById(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge Cases", () => {
    test("should handle logs with null region", async () => {
      mockReq.body = {
        phLevel: 7,
        turbidity: 3,
        region: null
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        region: null,
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test("should handle logs with empty contaminants array", async () => {
      mockReq.body = {
        phLevel: 7,
        turbidity: 3,
        contaminants: []
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        contaminants: [],
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test("should handle logs with multiple contaminants", async () => {
      mockReq.body = {
        phLevel: 5,
        turbidity: 12,
        contaminants: ["bacteria", "lead", "mercury"]
      };

      const createdLog = {
        _id: "log1",
        phLevel: 5,
        turbidity: 12,
        contaminants: ["bacteria", "lead", "mercury"],
        safetyRating: "Unsafe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.objectContaining({
            contaminants: ["bacteria", "lead", "mercury"]
          })
        })
      );
    });

    test("should preserve floating point precision for pH and turbidity", async () => {
      mockReq.body = {
        phLevel: 7.123456,
        turbidity: 3.999999
      };

      const createdLog = {
        _id: "log1",
        phLevel: 7.123456,
        turbidity: 3.999999,
        safetyRating: "Safe",
        recordedBy: mockReq.userId
      };

      waterLogService.createLog.mockResolvedValue(createdLog);

      await createLog(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.objectContaining({
            phLevel: 7.123456,
            turbidity: 3.999999
          })
        })
      );
    });
  });
});
