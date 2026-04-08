import express from "express";
import request from "supertest";
import axios from "axios";

import reportRoutes from "../../../routes/reportRoutes.js";
import ContaminationReport from "../../../models/contaminationReport.js";
import WaterLog from "../../../models/waterLog.js";
import Task from "../../../models/task.js";
import reportPdfService from "../../../services/reportPdfService.js";

// Mock external & DB-related modules so no real calls are made
jest.mock("axios");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/waterLog.js");
jest.mock("../../../models/task.js");
jest.mock("../../../services/reportPdfService.js");

// Mock auth middleware: inject user identity & role without real JWT
jest.mock("../../../middleware/authMiddleware.js", () => ({
	verifyToken: (req, res, next) => {
		// Allow role override via header for tests
		const roleFromHeader = req.headers["x-test-role"];
		req.userId = req.headers["x-test-user-id"] || "test-user-id";
		req.userRole = roleFromHeader || "citizen";
		req.userEmail = "test@example.com";
		next();
	},
	checkRole: (allowedRoles) => (req, res, next) => {
		if (!allowedRoles.includes(req.userRole)) {
			return res.status(403).json({ message: "You do not have permission to access this resource" });
		}
		next();
	}
}));

// Build a minimal Express app for Supertest
const createApp = () => {
	const app = express();
	app.use(express.json());
	app.use("/api/reports", reportRoutes);
	return app;
};

describe("Contamination Report API - Integration (Supertest)", () => {
	let app;

	beforeEach(() => {
		jest.clearAllMocks();
		app = createApp();
	});

	// =============== POST /api/reports (create report) ===============
	describe("POST /api/reports", () => {
		test("should create a report with valid data (citizen)", async () => {
			const mockSavedReport = {
				_id: "rep1",
				title: "Test",
				description: "Desc",
				address: "Somewhere",
				location: { type: "Point", coordinates: [80.0, 7.0] },
				reportedBy: "test-user-id"
			};

			const mockSave = jest.fn().mockResolvedValue(mockSavedReport);

			ContaminationReport.mockImplementation(() => ({
				...mockSavedReport,
				save: mockSave
			}));

			axios.get.mockResolvedValue({
				data: { display_name: "Somewhere" }
			});

			const res = await request(app)
				.post("/api/reports")
				.set("x-test-role", "citizen")
				.send({
					title: "Test",
					description: "Desc",
					latitude: 7.0,
					longitude: 80.0
				});

			expect(res.status).toBe(201);
			expect(mockSave).toHaveBeenCalled();
			expect(res.body).toHaveProperty("report");
			expect(res.body.report.title).toBe("Test");
		});

		test("should validate required fields and return 400 for missing data", async () => {
			const res = await request(app)
				.post("/api/reports")
				.set("x-test-role", "citizen")
				.send({
					title: "Missing coords",
					description: "No lat/lng"
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/Title, description, latitude and longitude are required/);
		});

		test("should return 400 for invalid imageUrl", async () => {
			const res = await request(app)
				.post("/api/reports")
				.set("x-test-role", "citizen")
				.send({
					title: "Has image",
					description: "Desc",
					latitude: 7.0,
					longitude: 80.0,
					imageUrl: "ftp://invalid"
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/Image URL must start with http/);
		});

		test("should not fail if reverse geocoding throws (axios error)", async () => {
			const mockSave = jest.fn().mockResolvedValue({ _id: "rep2" });

			ContaminationReport.mockImplementation(() => ({
				save: mockSave
			}));

			axios.get.mockRejectedValue(new Error("network error"));

			const res = await request(app)
				.post("/api/reports")
				.set("x-test-role", "citizen")
				.send({
					title: "Geo fail",
					description: "Desc",
					latitude: 7.0,
					longitude: 80.0
				});

			expect(res.status).toBe(201);
			expect(mockSave).toHaveBeenCalled();
		});
	});

	// =============== GET /api/reports/all ===============
	describe("GET /api/reports/all", () => {
		test("should allow admin to get all reports", async () => {
			const mockReports = [{ _id: "1" }, { _id: "2" }];

			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockReports)
			});

			const res = await request(app)
				.get("/api/reports/all")
				.set("x-test-role", "admin");

			expect(res.status).toBe(200);
			expect(res.body.length).toBe(2);
		});

		test("should forbid citizen from accessing all reports", async () => {
			const res = await request(app)
				.get("/api/reports/all")
				.set("x-test-role", "citizen");

			expect(res.status).toBe(403);
		});
	});

	// =============== GET /api/reports/:id ===============
	describe("GET /api/reports/:id", () => {
		test("admin can fetch any report by id", async () => {
			const chain = {
				populate: jest.fn().mockResolvedValue({ _id: "rep1" })
			};
			ContaminationReport.findById.mockReturnValue(chain);

			const res = await request(app)
				.get("/api/reports/rep1")
				.set("x-test-role", "admin");

			expect(ContaminationReport.findById).toHaveBeenCalledWith("rep1");
			expect(res.status).toBe(200);
			expect(res.body._id).toBe("rep1");
		});

		test("citizen can only fetch own report", async () => {
			const userId = "citizen-1";

			const chain = {
				populate: jest.fn().mockResolvedValue({
					_id: "rep1",
					reportedBy: userId
				})
			};
			ContaminationReport.findOne.mockReturnValue(chain);

			const res = await request(app)
				.get("/api/reports/rep1")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", userId);

			expect(ContaminationReport.findOne).toHaveBeenCalledWith({
				_id: "rep1",
				reportedBy: userId
			});
			expect(res.status).toBe(200);
		});

		test("returns 404 when report not found or not authorized", async () => {
			const chain = {
				populate: jest.fn().mockResolvedValue(null)
			};
			ContaminationReport.findOne.mockReturnValue(chain);

			const res = await request(app)
				.get("/api/reports/non-existent")
				.set("x-test-role", "citizen");

			expect(res.status).toBe(404);
			expect(res.body.message).toMatch(/Report not found or not authorized/);
		});
	});

	// =============== GET /api/reports/my-reports ===============
	describe("GET /api/reports/my-reports", () => {
		test("should fetch reports for logged-in citizen", async () => {
			const userId = "citizen-1";
			const mockReports = [{ _id: "1", reportedBy: userId }];

			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockReports)
			});

			const res = await request(app)
				.get("/api/reports/my-reports")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", userId);

			expect(ContaminationReport.find).toHaveBeenCalledWith({ reportedBy: userId });
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
		});
	});

	// =============== GET /api/reports/confirmed ===============
	describe("GET /api/reports/confirmed", () => {
		test("should return confirmed reports for any authenticated user", async () => {
			const mockReports = [{ _id: "1", status: "Confirmed" }];

			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockReports)
			});

			const res = await request(app)
				.get("/api/reports/confirmed")
				.set("x-test-role", "citizen");

			expect(ContaminationReport.find).toHaveBeenCalledWith({ status: "Confirmed" });
			expect(res.status).toBe(200);
			expect(res.body[0].status).toBe("Confirmed");
		});
	});

	// =============== GET /api/reports/pending ===============
	describe("GET /api/reports/pending", () => {
		test("should allow admin to fetch pending reports", async () => {
			// Controller uses reportService.getPendingReports, which uses ContaminationReport under the hood.
			// Here we simulate the final HTTP behavior by mocking ContaminationReport.find chain.
			const mockReports = [{ _id: "1", status: "Unverified" }];
			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockReturnValue({
					sort: jest.fn().mockResolvedValue(mockReports)
				})
			});

			const res = await request(app)
				.get("/api/reports/pending")
				.set("x-test-role", "admin");

			expect(res.status).toBe(200);
			expect(res.body[0].status).toBe("Unverified");
		});

		test("should forbid citizen from accessing pending reports", async () => {
			const res = await request(app)
				.get("/api/reports/pending")
				.set("x-test-role", "citizen");

			expect(res.status).toBe(403);
		});
	});

	// =============== GET /api/reports?lat=&lng=&radius= ===============
	describe("GET /api/reports (radius search)", () => {
		test("should validate presence of lat, lng, radius", async () => {
			const res = await request(app)
				.get("/api/reports")
				.set("x-test-role", "citizen");

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/Latitude, longitude and radius required/);
		});

		test("should return reports within radius", async () => {
			const mockReports = [{ _id: "1" }];

			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockReports)
			});

			const res = await request(app)
				.get("/api/reports")
				.set("x-test-role", "citizen")
				.query({ lat: 7.0, lng: 80.0, radius: 5 });

			expect(ContaminationReport.find).toHaveBeenCalled();
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
		});
	});

	// =============== PUT /api/reports/:id ===============
	describe("PUT /api/reports/:id", () => {
		test("citizen can update own unverified report fields", async () => {
			const userId = "citizen-1";
			const reportDoc = {
				_id: "rep1",
				status: "Unverified",
				reportedBy: { toString: () => userId },
				save: jest.fn().mockResolvedValue({}),
				location: { type: "Point", coordinates: [80, 7] }
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			axios.get.mockResolvedValue({ data: { display_name: "Updated Address" } });

			const res = await request(app)
				.put("/api/reports/rep1")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", userId)
				.send({
					title: "Updated",
					description: "Updated desc",
					latitude: 7.1,
					longitude: 80.1
				});

			expect(reportDoc.save).toHaveBeenCalled();
			expect(res.status).toBe(200);
			expect(res.body.message).toMatch(/Report updated successfully/);
		});

		test("citizen cannot update someone else's report", async () => {
			const reportDoc = {
				_id: "rep1",
				status: "Unverified",
				reportedBy: { toString: () => "other-user" }
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			const res = await request(app)
				.put("/api/reports/rep1")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", "citizen-1")
				.send({ title: "Should fail" });

			expect(res.status).toBe(403);
			expect(res.body.message).toMatch(/Not authorized/);
		});

		test("admin can update status only", async () => {
			const reportDoc = {
				_id: "rep1",
				status: "Unverified",
				reportedBy: { toString: () => "citizen-1" },
				save: jest.fn().mockResolvedValue({})
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			const res = await request(app)
				.put("/api/reports/rep1")
				.set("x-test-role", "admin")
				.send({ status: "Confirmed" });

			expect(reportDoc.save).toHaveBeenCalled();
			expect(res.status).toBe(200);
		});

		test("admin update without status should return 400", async () => {
			const reportDoc = {
				_id: "rep1",
				status: "Unverified",
				reportedBy: { toString: () => "citizen-1" },
				save: jest.fn()
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			const res = await request(app)
				.put("/api/reports/rep1")
				.set("x-test-role", "admin")
				.send({ title: "Not allowed" });

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/Admins can only update status/);
		});
	});

	// =============== PUT /api/reports/:id/status ===============
	describe("PUT /api/reports/:id/status", () => {
		test("admin can update status field only", async () => {
			const reportDoc = {
				_id: "rep1",
				status: "Unverified",
				save: jest.fn().mockResolvedValue({})
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			const res = await request(app)
				.put("/api/reports/rep1/status")
				.set("x-test-role", "admin")
				.send({ status: "Confirmed" });

			expect(reportDoc.save).toHaveBeenCalled();
			expect(reportDoc.status).toBe("Confirmed");
			expect(res.status).toBe(200);
		});

		test("citizen is forbidden from updating status", async () => {
			const res = await request(app)
				.put("/api/reports/rep1/status")
				.set("x-test-role", "citizen")
				.send({ status: "Confirmed" });

			expect(res.status).toBe(403);
		});

		test("missing status should return 400", async () => {
			const res = await request(app)
				.put("/api/reports/rep1/status")
				.set("x-test-role", "admin")
				.send({});

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/Status is required/);
		});
	});

	// =============== DELETE /api/reports/:id ===============
	describe("DELETE /api/reports/:id", () => {
		test("citizen can delete own report and cascade delete logs & tasks", async () => {
			const userId = "citizen-1";

			const reportDoc = {
				_id: "rep1",
				reportedBy: { toString: () => userId },
				deleteOne: jest.fn().mockResolvedValue({})
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);
			WaterLog.deleteMany.mockResolvedValue({ deletedCount: 2 });
			Task.deleteMany.mockResolvedValue({ deletedCount: 1 });

			const res = await request(app)
				.delete("/api/reports/rep1")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", userId);

			expect(WaterLog.deleteMany).toHaveBeenCalledWith({ reportId: "rep1" });
			expect(Task.deleteMany).toHaveBeenCalledWith({ reportId: "rep1" });
			expect(reportDoc.deleteOne).toHaveBeenCalled();
			expect(res.status).toBe(200);
			expect(res.body.deletedWaterLogs).toBe(2);
			expect(res.body.deletedTasks).toBe(1);
		});

		test("citizen cannot delete someone else's report", async () => {
			const reportDoc = {
				_id: "rep1",
				reportedBy: { toString: () => "other-user" }
			};

			ContaminationReport.findById.mockResolvedValue(reportDoc);

			const res = await request(app)
				.delete("/api/reports/rep1")
				.set("x-test-role", "citizen")
				.set("x-test-user-id", "citizen-1");

			expect(res.status).toBe(403);
			expect(res.body.message).toMatch(/Not authorized to delete this report/);
		});

		test("returns 404 if report does not exist", async () => {
			ContaminationReport.findById.mockResolvedValue(null);

			const res = await request(app)
				.delete("/api/reports/unknown")
				.set("x-test-role", "admin");

			expect(res.status).toBe(404);
			expect(res.body.message).toMatch(/Report not found/);
		});
	});

	// =============== PDF DOWNLOAD ENDPOINTS (mocking reportPdfService) ===============
	describe("PDF download endpoints", () => {
		test("GET /api/reports/:id/pdf should stream single report PDF", async () => {
			const mockReport = { _id: "rep1", reportedBy: { firstName: "A", email: "a@test.com" } };
			const chain = { populate: jest.fn().mockResolvedValue(mockReport) };
			ContaminationReport.findOne.mockReturnValue(chain);

			const pdfBuffer = Buffer.from("PDF-DATA");
			reportPdfService.buildSingleReportPdf.mockResolvedValue(pdfBuffer);

			const res = await request(app)
				.get("/api/reports/rep1/pdf")
				.set("x-test-role", "citizen");

			expect(reportPdfService.buildSingleReportPdf).toHaveBeenCalledWith(mockReport);
			expect(res.status).toBe(200);
			expect(res.header["content-type"]).toMatch(/application\/pdf/);
		});

		test("GET /api/reports/all/pdf should be admin/authority only and use reportPdfService", async () => {
			const mockReports = [{ _id: "1" }, { _id: "2" }];

			ContaminationReport.find.mockReturnValue({
				populate: jest.fn().mockResolvedValue(mockReports)
			});

			const pdfBuffer = Buffer.from("ALL-PDF");
			reportPdfService.buildAllReportsPdf.mockResolvedValue(pdfBuffer);

			const res = await request(app)
				.get("/api/reports/all/pdf")
				.set("x-test-role", "admin");

			expect(reportPdfService.buildAllReportsPdf).toHaveBeenCalledWith(mockReports);
			expect(res.status).toBe(200);
			expect(res.header["content-type"]).toMatch(/application\/pdf/);
		});
	});
});

