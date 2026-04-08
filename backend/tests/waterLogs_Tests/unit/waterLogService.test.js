import waterLogService from "../../../services/waterLogService.js";
import WaterLog from "../../../models/waterLog.js";
import ContaminationReport from "../../../models/contaminationReport.js";
import Task from "../../../models/task.js";
import smsService from "../../../services/smsService.js";

// Mock the models and services
jest.mock("../../../models/waterLog.js");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/task.js");
jest.mock("../../../services/smsService.js");

describe("WaterLogService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== pH & TURBIDITY VALIDATION ====================
  describe("pH & Turbidity Validation", () => {
    describe("calculateSafetyRating - Valid Ranges", () => {
      test("should accept pH between 0 and 14", () => {
        const validPHValues = [0, 6.5, 7, 8.5, 14];
        const turbidity = 3; // Safe turbidity

        validPHValues.forEach((ph) => {
          expect(() => waterLogService.calculateSafetyRating(ph, turbidity)).not.toThrow();
        });
      });

      test("should accept turbidity >= 0", () => {
        const pH = 7; // Safe pH
        const validTurbidityValues = [0, 1, 5, 10, 100];

        validTurbidityValues.forEach((turbidity) => {
          expect(() => waterLogService.calculateSafetyRating(pH, turbidity)).not.toThrow();
        });
      });
    });

    describe("calculateSafetyRating - Boundary Conditions", () => {
      test("should handle pH boundary: exactly 0 and 14", () => {
        expect(waterLogService.calculateSafetyRating(0, 3)).toBeDefined();
        expect(waterLogService.calculateSafetyRating(14, 3)).toBeDefined();
      });

      test("should handle turbidity boundary: exactly 0", () => {
        expect(waterLogService.calculateSafetyRating(7, 0)).toBeDefined();
      });

      test("should handle pH safe range boundaries: 6.5 and 8.5", () => {
        // pH 6.5 with safe turbidity should be Safe
        expect(waterLogService.calculateSafetyRating(6.5, 3)).toBe("Safe");
        // pH 8.5 with safe turbidity should be Safe
        expect(waterLogService.calculateSafetyRating(8.5, 3)).toBe("Safe");
      });

      test("should handle turbidity safe boundary: exactly 5 NTU", () => {
        // Turbidity 5 with safe pH should be Safe
        expect(waterLogService.calculateSafetyRating(7, 5)).toBe("Safe");
      });
    });
  });

  // ==================== SAFETY RATING LOGIC ====================
  describe("Safety Rating Calculation", () => {
    describe("Safe Rating", () => {
      test("should return 'Safe' when pH and turbidity are optimal", () => {
        expect(waterLogService.calculateSafetyRating(7, 3)).toBe("Safe");
      });

      test("should return 'Safe' when both are within safe ranges", () => {
        expect(waterLogService.calculateSafetyRating(6.5, 2)).toBe("Safe");
        expect(waterLogService.calculateSafetyRating(7.5, 5)).toBe("Safe");
        expect(waterLogService.calculateSafetyRating(8.5, 1)).toBe("Safe");
      });

      test("should return 'Safe' at lower pH boundary with safe turbidity", () => {
        expect(waterLogService.calculateSafetyRating(6.5, 4)).toBe("Safe");
      });

      test("should return 'Safe' at upper pH boundary with safe turbidity", () => {
        expect(waterLogService.calculateSafetyRating(8.5, 4)).toBe("Safe");
      });

      test("should return 'Safe' at turbidity boundary with safe pH", () => {
        expect(waterLogService.calculateSafetyRating(7, 5)).toBe("Safe");
      });
    });

    describe("Warning Rating", () => {
      test("should return 'Warning' when pH is slightly out of range", () => {
        expect(waterLogService.calculateSafetyRating(6.0, 3)).toBe("Warning");
        expect(waterLogService.calculateSafetyRating(9.0, 3)).toBe("Warning");
      });

      test("should return 'Warning' when turbidity is between 5 and 10", () => {
        expect(waterLogService.calculateSafetyRating(7, 6)).toBe("Warning");
        expect(waterLogService.calculateSafetyRating(7, 8)).toBe("Warning");
      });

      test("should return 'Warning' when either metric is slightly compromised", () => {
        expect(waterLogService.calculateSafetyRating(6.2, 7)).toBe("Warning");
        expect(waterLogService.calculateSafetyRating(8.8, 6)).toBe("Warning");
      });
    });

    describe("Unsafe Rating", () => {
      test("should return 'Unsafe' when pH is critically low (< 6.0)", () => {
        expect(waterLogService.calculateSafetyRating(5.9, 3)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(5.0, 3)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(0, 3)).toBe("Unsafe");
      });

      test("should return 'Unsafe' when pH is critically high (> 9.0)", () => {
        expect(waterLogService.calculateSafetyRating(9.1, 3)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(10.0, 3)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(14, 3)).toBe("Unsafe");
      });

      test("should return 'Unsafe' when turbidity is critically high (> 10)", () => {
        expect(waterLogService.calculateSafetyRating(7, 10.1)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(7, 15)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(7, 100)).toBe("Unsafe");
      });

      test("should return 'Unsafe' when both metrics are critically compromised", () => {
        expect(waterLogService.calculateSafetyRating(5.0, 15)).toBe("Unsafe");
        expect(waterLogService.calculateSafetyRating(11.0, 12)).toBe("Unsafe");
      });
    });
  });

  // ==================== DATABASE QUERIES ====================
  describe("Database Queries", () => {
    const mockUserId = "66a1234567890abcdef12345";
    const mockReportId = "66b1234567890abcdef12345";

    describe("getAllLogs", () => {
      test("should fetch all logs without filter", async () => {
        const mockLogs = [
          { _id: "1", phLevel: 7, turbidity: 3, safetyRating: "Safe" },
          { _id: "2", phLevel: 5, turbidity: 12, safetyRating: "Unsafe" }
        ];

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockLogs)
        });

        const result = await waterLogService.getAllLogs({});

        expect(WaterLog.find).toHaveBeenCalledWith({});
        expect(result).toEqual(mockLogs);
        expect(result.length).toBe(2);
      });

      test("should fetch logs filtered by region", async () => {
        const mockLogs = [
          { _id: "1", region: "North", phLevel: 7, safetyRating: "Safe" }
        ];

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockLogs)
        });

        const result = await waterLogService.getAllLogs({ region: "North" });

        expect(WaterLog.find).toHaveBeenCalledWith({ region: "North" });
        expect(result).toEqual(mockLogs);
      });

      test("should fetch logs filtered by safetyRating", async () => {
        const mockLogs = [
          { _id: "1", safetyRating: "Unsafe" },
          { _id: "2", safetyRating: "Unsafe" }
        ];

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockLogs)
        });

        const result = await waterLogService.getAllLogs({ safetyRating: "Unsafe" });

        expect(WaterLog.find).toHaveBeenCalledWith({ safetyRating: "Unsafe" });
        expect(result.every(log => log.safetyRating === "Unsafe")).toBe(true);
      });

      test("should sort logs by most recent first", async () => {
        const mockLogs = [];
        const sortMock = jest.fn().mockResolvedValue(mockLogs);

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: sortMock
        });

        await waterLogService.getAllLogs({});

        expect(sortMock).toHaveBeenCalledWith({ recordedAt: -1 });
      });

      test("should throw error on database failure", async () => {
        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockRejectedValue(new Error("DB connection failed"))
        });

        await expect(waterLogService.getAllLogs({})).rejects.toThrow("Failed to fetch water logs");
      });
    });

    describe("getLogById", () => {
      test("should fetch a single log by ID", async () => {
        const mockLog = { _id: "1", phLevel: 7, turbidity: 3 };

        // Mock the chain: findById().populate().populate()
        const chainMock = {
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.findById.mockReturnValue(chainMock);
        // The second populate() also returns the chain, then it resolves
        chainMock.populate.mockReturnValue(chainMock);
        // Finally, when awaited, it returns the mock log
        Object.defineProperty(chainMock, Symbol.toStringTag, { value: 'Promise' });
        chainMock.then = jest.fn(function(resolve) {
          resolve(mockLog);
          return this;
        });
        chainMock.catch = jest.fn().mockReturnThis();

        const result = await waterLogService.getLogById("1");

        expect(WaterLog.findById).toHaveBeenCalledWith("1");
        expect(result).toEqual(mockLog);
      });

      test("should throw 'not found' error for non-existent log", async () => {
        const chainMock = {
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.findById.mockReturnValue(chainMock);
        chainMock.populate.mockReturnValue(chainMock);
        
        // When awaited, return null to trigger "not found"
        chainMock.then = jest.fn(function(resolve) {
          resolve(null);
          return this;
        });
        chainMock.catch = jest.fn().mockReturnThis();

        await expect(waterLogService.getLogById("invalid_id")).rejects.toThrow("Water log not found");
      });
    });

    describe("getLogsByRegion", () => {
      test("should fetch logs for a specific region", async () => {
        const mockLogs = [
          { _id: "1", region: "South", phLevel: 7 },
          { _id: "2", region: "South", phLevel: 8 }
        ];

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockLogs)
        });

        const result = await waterLogService.getLogsByRegion("South");

        expect(WaterLog.find).toHaveBeenCalledWith({ region: "South" });
        expect(result.length).toBe(2);
        expect(result.every(log => log.region === "South")).toBe(true);
      });

      test("should sort region logs by most recent first", async () => {
        const sortMock = jest.fn().mockResolvedValue([]);

        WaterLog.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: sortMock
        });

        await waterLogService.getLogsByRegion("East");

        expect(sortMock).toHaveBeenCalledWith({ recordedAt: -1 });
      });
    });
  });

  // ==================== SMS NOTIFICATION LOGIC ====================
  describe("SMS Notification Logic", () => {
    const mockUserId = "66a1234567890abcdef12345";
    const mockReportId = "66b1234567890abcdef12345";

    describe("SMS sending on log creation", () => {
      test("should send SMS when water is marked Safe and report exists", async () => {
        const mockReport = {
          _id: mockReportId,
          status: "Pending",
          address: "Main Street",
          reportedBy: {
            firstName: "John",
            lastName: "Doe",
            phoneNumber: "+1234567890"
          },
          save: jest.fn().mockResolvedValue({ status: "Resolved" })
        };

        const mockLog = {
          _id: "log1",
          phLevel: 7,
          turbidity: 3,
          safetyRating: "Safe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        // Mock report chain with double populate
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockResolvedValue({ success: true });
        Task.findOne.mockResolvedValue({ status: "pending", save: jest.fn().mockResolvedValue() });

        await waterLogService.createLog({
          phLevel: 7,
          turbidity: 3,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).toHaveBeenCalledWith(
          "+1234567890",
          expect.stringContaining("Resolved")
        );
      });

      test("should send SMS when water is marked Unsafe and report exists", async () => {
        const mockReport = {
          _id: mockReportId,
          status: "Pending",
          address: "Main Street",
          reportedBy: {
            firstName: "John",
            lastName: "Doe",
            phoneNumber: "+1234567890"
          },
          save: jest.fn().mockResolvedValue({ status: "Confirmed" })
        };

        const mockLog = {
          _id: "log1",
          phLevel: 5,
          turbidity: 12,
          safetyRating: "Unsafe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockResolvedValue({ success: true });

        await waterLogService.createLog({
          phLevel: 5,
          turbidity: 12,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).toHaveBeenCalledWith(
          "+1234567890",
          expect.stringContaining("Verified")
        );
      });

      test("should NOT send SMS when water is Warning status", async () => {
        const mockReport = {
          _id: mockReportId,
          status: "Pending",
          address: "Main Street",
          reportedBy: {
            firstName: "John",
            lastName: "Doe",
            phoneNumber: "+1234567890"
          },
          save: jest.fn().mockResolvedValue()
        };

        const mockLog = {
          _id: "log1",
          phLevel: 6.2,
          turbidity: 7,
          safetyRating: "Warning",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockResolvedValue({ success: true });

        await waterLogService.createLog({
          phLevel: 6.2,
          turbidity: 7,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).not.toHaveBeenCalled();
      });

      test("should NOT send SMS if reporter has no phone number", async () => {
        const mockReport = {
          _id: mockReportId,
          status: "Pending",
          address: "Main Street",
          reportedBy: {
            firstName: "John",
            lastName: "Doe",
            phoneNumber: null
          },
          save: jest.fn().mockResolvedValue()
        };

        const mockLog = {
          _id: "log1",
          phLevel: 7,
          turbidity: 3,
          safetyRating: "Safe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);

        await waterLogService.createLog({
          phLevel: 7,
          turbidity: 3,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).not.toHaveBeenCalled();
      });

      test("should not block log creation if SMS sending fails", async () => {
        const mockReport = {
          _id: mockReportId,
          status: "Pending",
          address: "Main Street",
          reportedBy: {
            firstName: "John",
            lastName: "Doe",
            phoneNumber: "+1234567890"
          },
          save: jest.fn().mockResolvedValue({ status: "Resolved" })
        };

        const mockLog = {
          _id: "log1",
          phLevel: 7,
          turbidity: 3,
          safetyRating: "Safe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockRejectedValue(new Error("SMS Gateway down"));
        Task.findOne.mockResolvedValue({ status: "pending", save: jest.fn().mockResolvedValue() });

        const result = await waterLogService.createLog({
          phLevel: 7,
          turbidity: 3,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(result).toBeDefined();
        expect(result.safetyRating).toBe("Safe");
      });
    });

    describe("SMS message formatting", () => {
      test("should include reporter's full name in Safe SMS", async () => {
        const mockReport = {
          _id: mockReportId,
          address: "Park Avenue",
          reportedBy: {
            firstName: "Jane",
            lastName: "Smith",
            phoneNumber: "+9876543210"
          },
          save: jest.fn().mockResolvedValue({ status: "Resolved" })
        };

        const mockLog = {
          _id: "log1",
          phLevel: 7,
          turbidity: 3,
          safetyRating: "Safe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockResolvedValue({ success: true });
        Task.findOne.mockResolvedValue({ status: "pending", save: jest.fn().mockResolvedValue() });

        await waterLogService.createLog({
          phLevel: 7,
          turbidity: 3,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).toHaveBeenCalledWith(
          "+9876543210",
          expect.stringContaining("Jane Smith")
        );
      });

      test("should include location in SMS message", async () => {
        const mockReport = {
          _id: mockReportId,
          address: "Downtown District",
          reportedBy: {
            firstName: "Tom",
            lastName: "Johnson",
            phoneNumber: "+1111111111"
          },
          save: jest.fn().mockResolvedValue({ status: "Resolved" })
        };

        const mockLog = {
          _id: "log1",
          phLevel: 7,
          turbidity: 3,
          safetyRating: "Safe",
          reportId: mockReportId,
          recordedBy: mockUserId,
          save: jest.fn().mockResolvedValue(),
          populate: jest.fn().mockReturnThis()
        };

        WaterLog.mockImplementation(() => mockLog);
        
        const reportChainMock = {
          populate: jest.fn().mockReturnThis()
        };
        reportChainMock.populate.mockReturnValue(reportChainMock);
        reportChainMock.then = jest.fn(function(resolve) {
          resolve(mockReport);
          return this;
        });
        reportChainMock.catch = jest.fn().mockReturnThis();
        ContaminationReport.findById.mockReturnValue(reportChainMock);
        
        smsService.sendAlert.mockResolvedValue({ success: true });
        Task.findOne.mockResolvedValue({ status: "pending", save: jest.fn().mockResolvedValue() });

        await waterLogService.createLog({
          phLevel: 7,
          turbidity: 3,
          reportId: mockReportId,
          recordedBy: mockUserId
        });

        expect(smsService.sendAlert).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining("Downtown District")
        );
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe("Error Handling", () => {
    test("should throw error when creating log with invalid data", async () => {
      WaterLog.mockImplementation(() => {
        throw new Error("Validation failed");
      });

      await expect(
        waterLogService.createLog({ phLevel: "invalid", turbidity: 3 })
      ).rejects.toThrow("Failed to create water log");
    });

    test("should handle missing reportId gracefully", async () => {
      const mockLog = {
        _id: "log1",
        phLevel: 7,
        turbidity: 3,
        safetyRating: "Safe",
        reportId: null,
        recordedBy: "user1",
        save: jest.fn().mockResolvedValue(),
        populate: jest.fn().mockReturnThis()
      };

      WaterLog.mockImplementation(() => mockLog);

      const result = await waterLogService.createLog({
        phLevel: 7,
        turbidity: 3,
        recordedBy: "user1"
      });

      expect(result.reportId).toBeNull();
    });
  });
});
