import reportService from "../../../services/reportService.js";
import ContaminationReport from "../../../models/contaminationReport.js";

// Mock the ContaminationReport Mongoose model so no real DB is used
jest.mock("../../../models/contaminationReport.js");

describe("ReportService - Pending Reports", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getPendingReports", () => {
		test("should filter by status=Unverified and sort latest first", async () => {
			const mockReports = [
				{ _id: "2", status: "Unverified", createdAt: new Date("2024-02-01") },
				{ _id: "1", status: "Unverified", createdAt: new Date("2024-01-01") }
			];

			const sortMock = jest.fn().mockResolvedValue(mockReports);
			const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

			ContaminationReport.find.mockReturnValue({
				populate: populateMock
			});

			const result = await reportService.getPendingReports();

			expect(ContaminationReport.find).toHaveBeenCalledWith({ status: "Unverified" });
			expect(populateMock).toHaveBeenCalledWith(
				"reportedBy",
				"firstName lastName email phoneNumber location"
			);
			expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
			expect(result).toEqual(mockReports);
		});

		test("should throw a wrapped error when query fails", async () => {
			const sortError = new Error("DB failure");
			const sortMock = jest.fn().mockRejectedValue(sortError);
			const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

			ContaminationReport.find.mockReturnValue({
				populate: populateMock
			});

			await expect(reportService.getPendingReports()).rejects.toThrow(
				"Failed to fetch pending reports: DB failure"
			);
		});
	});

	describe("getPendingReportsCount", () => {
		test("should return the count of pending (Unverified) reports", async () => {
			ContaminationReport.countDocuments.mockResolvedValue(5);

			const count = await reportService.getPendingReportsCount();

			expect(ContaminationReport.countDocuments).toHaveBeenCalledWith({ status: "Unverified" });
			expect(count).toBe(5);
		});

		test("should throw a wrapped error when count query fails", async () => {
			ContaminationReport.countDocuments.mockRejectedValue(new Error("count error"));

			await expect(reportService.getPendingReportsCount()).rejects.toThrow(
				"Failed to count pending reports: count error"
			);
		});
	});
});

