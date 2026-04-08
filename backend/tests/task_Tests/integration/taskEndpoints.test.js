import taskService from "../../../services/taskService.js";
import Task from "../../../models/task.js";
import ContaminationReport from "../../../models/contaminationReport.js";
import User from "../../../models/user.js";
import {
  createTask,
  getTasks,
  getTaskById,
  getMyTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getAuthorities
} from "../../../controllers/taskController.js";

// Mock the service and models
jest.mock("../../../services/taskService.js");
jest.mock("../../../models/task.js");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/user.js");

describe("Task Endpoints - Integration Tests", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      userId: "66a0000000000000000000aa",  // admin by default
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

  // ==================== TASK CREATION FLOW ====================
  describe("Task Creation Flow - POST /api/tasks", () => {
    test("should create a task and return 201 with task data", async () => {
      const taskData = {
        reportId: "report123",
        assignedTo: "authority456",
        priority: "high",
        title: "Fix Water Contamination",
        description: "Investigate and fix"
      };

      const createdTask = {
        _id: "task001",
        ...taskData,
        assignedBy: mockReq.userId,
        status: "pending",
        createdAt: new Date()
      };

      mockReq.body = taskData;
      taskService.createTask.mockResolvedValue(createdTask);

      await createTask(mockReq, mockRes);

      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: "report123",
          assignedTo: "authority456",
          assignedBy: mockReq.userId,
          title: "Fix Water Contamination"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Task created successfully",
        task: createdTask
      });
    });

    test("should return 400 when reportId is missing", async () => {
      mockReq.body = {
        assignedTo: "authority456",
        title: "Fix Issue"
      };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields: reportId, assignedTo, and title are required"
      });
    });

    test("should return 400 when assignedTo is missing", async () => {
      mockReq.body = {
        reportId: "report123",
        title: "Fix Issue"
      };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields: reportId, assignedTo, and title are required"
      });
    });

    test("should return 400 when title is missing", async () => {
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456"
      };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields: reportId, assignedTo, and title are required"
      });
    });

    test("should return 400 when priority is invalid", async () => {
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue",
        priority: "critical" // invalid
      };

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid priority. Must be: low, medium, or high"
      });
    });

    test("should accept valid priority values: low, medium, high", async () => {
      const validPriorities = ["low", "medium", "high"];

      for (const priority of validPriorities) {
        mockReq.body = {
          reportId: "report123",
          assignedTo: "authority456",
          title: "Fix Issue",
          priority
        };

        const createdTask = {
          _id: "task001",
          ...mockReq.body,
          assignedBy: mockReq.userId,
          status: "pending"
        };

        taskService.createTask.mockResolvedValue(createdTask);

        await createTask(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        jest.clearAllMocks();

        // Re-setup mockRes for next iteration
        mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
          locals: {}
        };
      }
    });

    test("should default priority to medium when not provided", async () => {
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue"
        // no priority
      };

      const createdTask = {
        _id: "task001",
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue",
        priority: "medium",
        assignedBy: mockReq.userId,
        status: "pending"
      };

      taskService.createTask.mockResolvedValue(createdTask);

      await createTask(mockReq, mockRes);

      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "medium" })
      );
    });

    test("should include optional dueDate when provided", async () => {
      const dueDate = "2025-12-31T00:00:00.000Z";
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue",
        dueDate
      };

      const createdTask = {
        _id: "task001",
        ...mockReq.body,
        assignedBy: mockReq.userId,
        status: "pending"
      };

      taskService.createTask.mockResolvedValue(createdTask);

      await createTask(mockReq, mockRes);

      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: expect.any(Date) })
      );
    });

    test("should return 400 when service throws Report not found error", async () => {
      mockReq.body = {
        reportId: "report_nonexistent",
        assignedTo: "authority456",
        title: "Fix Issue"
      };

      taskService.createTask.mockRejectedValue(
        new Error("Failed to create task: Report not found")
      );

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 when report is already Resolved", async () => {
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue"
      };

      taskService.createTask.mockRejectedValue(
        new Error("Failed to create task: Cannot create a task for a report that is already Resolved")
      );

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ==================== GET ALL TASKS ====================
  describe("Get All Tasks - GET /api/tasks", () => {
    test("should fetch all tasks and return 200 with task list", async () => {
      const mockTasks = [
        { _id: "t1", title: "Task 1", priority: "high",   status: "pending" },
        { _id: "t2", title: "Task 2", priority: "medium", status: "completed" }
      ];

      taskService.getTasks.mockResolvedValue(mockTasks);
      mockReq.query = {};

      await getTasks(mockReq, mockRes);

      expect(taskService.getTasks).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Tasks retrieved successfully",
        count: 2,
        tasks: mockTasks
      });
    });

    test("should filter tasks by status query parameter", async () => {
      const mockTasks = [
        { _id: "t1", status: "pending" }
      ];

      taskService.getTasks.mockResolvedValue(mockTasks);
      mockReq.query = { status: "pending" };

      await getTasks(mockReq, mockRes);

      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
    });

    test("should filter tasks by priority query parameter", async () => {
      const mockTasks = [
        { _id: "t1", priority: "high" },
        { _id: "t2", priority: "high" }
      ];

      taskService.getTasks.mockResolvedValue(mockTasks);
      mockReq.query = { priority: "high" };

      await getTasks(mockReq, mockRes);

      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "high" })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 })
      );
    });

    test("should filter tasks by assignedTo query parameter", async () => {
      const authorityId = "authority456";
      const mockTasks = [{ _id: "t1", assignedTo: authorityId }];

      taskService.getTasks.mockResolvedValue(mockTasks);
      mockReq.query = { assignedTo: authorityId };

      await getTasks(mockReq, mockRes);

      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: authorityId })
      );
    });

    test("should filter tasks by reportId query parameter", async () => {
      const reportId = "report123";
      const mockTasks = [{ _id: "t1", reportId }];

      taskService.getTasks.mockResolvedValue(mockTasks);
      mockReq.query = { reportId };

      await getTasks(mockReq, mockRes);

      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ reportId })
      );
    });

    test("should return empty list when no tasks match filter", async () => {
      taskService.getTasks.mockResolvedValue([]);
      mockReq.query = { status: "completed" };

      await getTasks(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 0, tasks: [] })
      );
    });

    test("should return 500 when service throws database error", async () => {
      taskService.getTasks.mockRejectedValue(new Error("Database connection failed"));
      mockReq.query = {};

      await getTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Server error" })
      );
    });
  });

  // ==================== GET TASK BY ID ====================
  describe("Get Task By ID - GET /api/tasks/:id", () => {
    test("should fetch a single task by ID and return 200", async () => {
      const mockTask = {
        _id: "task001",
        title: "Fix Issue",
        status: "pending",
        reportId: { _id: "report123", title: "Water Issue" },
        assignedTo: { firstName: "Alice", lastName: "Smith" }
      };

      mockReq.params = { id: "task001" };
      taskService.getTaskById.mockResolvedValue(mockTask);

      await getTaskById(mockReq, mockRes);

      expect(taskService.getTaskById).toHaveBeenCalledWith("task001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Task retrieved successfully",
        task: mockTask
      });
    });

    test("should return 404 when task does not exist", async () => {
      mockReq.params = { id: "nonexistent" };
      taskService.getTaskById.mockRejectedValue(new Error("Task not found"));

      await getTaskById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task not found" })
      );
    });

    test("should return 500 on server errors", async () => {
      mockReq.params = { id: "task001" };
      taskService.getTaskById.mockRejectedValue(new Error("DB connection error"));

      await getTaskById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should include populated reportId and assignedTo in response", async () => {
      const mockTask = {
        _id: "task001",
        title: "Fix Issue",
        status: "pending",
        reportId: {
          _id: "report123",
          title: "Water Contamination",
          status: "In Progress",
          address: "123 Main St"
        },
        assignedTo: {
          _id: "authority456",
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@test.com",
          phoneNumber: "+1234567890"
        },
        assignedBy: {
          _id: "admin789",
          firstName: "Bob",
          lastName: "Jones"
        }
      };

      mockReq.params = { id: "task001" };
      taskService.getTaskById.mockResolvedValue(mockTask);

      await getTaskById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Task retrieved successfully",
        task: expect.objectContaining({
          reportId: expect.any(Object),
          assignedTo: expect.any(Object)
        })
      });
    });
  });

  // ==================== GET MY TASKS (AUTHORITY) ====================
  describe("Get My Tasks - GET /api/tasks/my-tasks", () => {
    test("should return 403 when non-authority user accesses my-tasks", async () => {
      mockReq.userRole = "citizen";

      await getMyTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Only authority users can access their assigned tasks"
      });
    });

    test("should return tasks for the authenticated authority user", async () => {
      const authorityId = "authority456";
      const mockTasks = [
        { _id: "t1", assignedTo: authorityId, status: "pending" },
        { _id: "t2", assignedTo: authorityId, status: "in_progress" }
      ];

      mockReq.userRole = "authority";
      mockReq.userId = authorityId;
      mockReq.query = {};

      taskService.getTasksByAuthority.mockResolvedValue(mockTasks);

      await getMyTasks(mockReq, mockRes);

      expect(taskService.getTasksByAuthority).toHaveBeenCalledWith(authorityId, null);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Tasks retrieved successfully",
        count: 2,
        tasks: mockTasks
      });
    });

    test("should filter my tasks by status when query provided", async () => {
      const authorityId = "authority456";
      const mockTasks = [{ _id: "t1", assignedTo: authorityId, status: "pending" }];

      mockReq.userRole = "authority";
      mockReq.userId = authorityId;
      mockReq.query = { status: "pending" };

      taskService.getTasksByAuthority.mockResolvedValue(mockTasks);

      await getMyTasks(mockReq, mockRes);

      expect(taskService.getTasksByAuthority).toHaveBeenCalledWith(authorityId, "pending");
    });

    test("should return 500 on server error for my-tasks", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "authority456";
      mockReq.query = {};
      taskService.getTasksByAuthority.mockRejectedValue(new Error("DB error"));

      await getMyTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ==================== UPDATE TASK STATUS ====================
  describe("Update Task Status - PUT /api/tasks/:id/status", () => {
    test("should update task status successfully and return 200", async () => {
      const updatedTask = {
        _id: "task001",
        status: "in_progress",
        title: "Fix Water Issue"
      };

      mockReq.params = { id: "task001" };
      mockReq.body = { status: "in_progress" };
      taskService.updateTaskStatus.mockResolvedValue(updatedTask);

      await updateTaskStatus(mockReq, mockRes);

      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
        "task001",
        "in_progress",
        mockReq.userId,
        mockReq.userRole,
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Task status updated successfully",
        task: updatedTask
      });
    });

    test("should return 400 when status is missing from body", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = {};

      await updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Status is required" });
    });

    test("should return 400 when status value is invalid", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = { status: "on_hold" }; // invalid

      await updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("Invalid status") })
      );
    });

    test("should accept all valid status values", async () => {
      const validStatuses = ["pending", "in_progress", "completed", "cancelled"];

      for (const status of validStatuses) {
        mockReq.params = { id: "task001" };
        mockReq.body = { status, cancellationReason: status === "cancelled" ? "Some reason" : undefined };
        taskService.updateTaskStatus.mockResolvedValue({ _id: "task001", status });

        await updateTaskStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        jest.clearAllMocks();

        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), locals: {} };
        mockReq = { userId: "66a0000000000000000000aa", userRole: "admin", params: {}, body: {}, query: {} };
      }
    });

    test("should return 404 when task not found during status update", async () => {
      mockReq.params = { id: "nonexistent" };
      mockReq.body = { status: "completed" };
      taskService.updateTaskStatus.mockRejectedValue(new Error("Task not found"));

      await updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("should return 403 when authority tries to update another user's task", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = { status: "completed" };
      mockReq.userRole = "authority";
      taskService.updateTaskStatus.mockRejectedValue(
        new Error("Forbidden: You can only update tasks assigned to you")
      );

      await updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test("should pass cancellationReason to service when provided", async () => {
      const updatedTask = { _id: "task001", status: "cancelled", cancellationReason: "Equipment failure" };

      mockReq.params = { id: "task001" };
      mockReq.body = { status: "cancelled", cancellationReason: "Equipment failure" };
      taskService.updateTaskStatus.mockResolvedValue(updatedTask);

      await updateTaskStatus(mockReq, mockRes);

      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
        "task001",
        "cancelled",
        mockReq.userId,
        mockReq.userRole,
        "Equipment failure"
      );
    });
  });

  // ==================== UPDATE TASK FIELDS ====================
  describe("Update Task - PUT /api/tasks/:id", () => {
    test("should update task fields successfully and return 200", async () => {
      const updatedTask = {
        _id: "task001",
        title: "Updated Title",
        priority: "high"
      };

      mockReq.params = { id: "task001" };
      mockReq.body = { title: "Updated Title", priority: "high" };
      taskService.updateTask.mockResolvedValue(updatedTask);

      await updateTask(mockReq, mockRes);

      expect(taskService.updateTask).toHaveBeenCalledWith(
        "task001",
        expect.objectContaining({ title: "Updated Title", priority: "high" })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Task updated successfully",
        task: updatedTask
      });
    });

    test("should return 404 when updating non-existent task", async () => {
      mockReq.params = { id: "nonexistent" };
      mockReq.body = { title: "New Title" };
      taskService.updateTask.mockRejectedValue(new Error("Task not found"));

      await updateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 for invalid priority in update", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = { priority: "critical" };
      taskService.updateTask.mockRejectedValue(new Error("Invalid priority. Must be: low, medium, or high"));

      await updateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 when new assignee is not an authority", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = { assignedTo: "citizen123" };
      taskService.updateTask.mockRejectedValue(new Error("Task can only be assigned to authority users"));

      await updateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should update resolutionNotes field", async () => {
      const updatedTask = { _id: "task001", resolutionNotes: "Issue fixed" };

      mockReq.params = { id: "task001" };
      mockReq.body = { resolutionNotes: "Issue fixed" };
      taskService.updateTask.mockResolvedValue(updatedTask);

      await updateTask(mockReq, mockRes);

      expect(taskService.updateTask).toHaveBeenCalledWith(
        "task001",
        expect.objectContaining({ resolutionNotes: "Issue fixed" })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== DELETE TASK ====================
  describe("Delete Task - DELETE /api/tasks/:id", () => {
    test("should delete a task successfully and return 200", async () => {
      mockReq.params = { id: "task001" };
      taskService.deleteTask.mockResolvedValue(undefined);

      await deleteTask(mockReq, mockRes);

      expect(taskService.deleteTask).toHaveBeenCalledWith("task001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Task deleted successfully" });
    });

    test("should return 404 when deleting non-existent task", async () => {
      mockReq.params = { id: "nonexistent" };
      taskService.deleteTask.mockRejectedValue(new Error("Task not found"));

      await deleteTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task not found" })
      );
    });

    test("should return 500 on server error during delete", async () => {
      mockReq.params = { id: "task001" };
      taskService.deleteTask.mockRejectedValue(new Error("DB error"));

      await deleteTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should log errors to console for debugging on delete failure", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockReq.params = { id: "task001" };
      taskService.deleteTask.mockRejectedValue(new Error("Unexpected error"));

      await deleteTask(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ==================== GET AUTHORITIES ====================
  describe("Get Authorities - GET /api/tasks/authorities", () => {
    test("should return list of authority users with 200", async () => {
      const mockAuthorities = [
        { _id: "u1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", location: "North" },
        { _id: "u2", firstName: "Bob",   lastName: "Jones", email: "bob@test.com",   location: "South" }
      ];

      taskService.getAuthorities.mockResolvedValue(mockAuthorities);

      await getAuthorities(mockReq, mockRes);

      expect(taskService.getAuthorities).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Authorities retrieved successfully",
        count: 2,
        authorities: mockAuthorities
      });
    });

    test("should return empty authorities list when no authorities exist", async () => {
      taskService.getAuthorities.mockResolvedValue([]);

      await getAuthorities(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 0, authorities: [] })
      );
    });

    test("should return 500 when getAuthorities fails", async () => {
      taskService.getAuthorities.mockRejectedValue(new Error("DB error"));

      await getAuthorities(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Server error" })
      );
    });
  });

  // ==================== ROLE-BASED AUTHORIZATION ====================
  describe("Role-Based Authorization", () => {
    test("POST /api/tasks should accept admin requests and create task", async () => {
      mockReq.userRole = "admin";
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue"
      };

      const createdTask = { _id: "task001", title: "Fix Issue", status: "pending" };
      taskService.createTask.mockResolvedValue(createdTask);

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test("GET /api/tasks should be accessible to admin users", async () => {
      mockReq.userRole = "admin";
      mockReq.query = {};
      taskService.getTasks.mockResolvedValue([]);

      await getTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("GET /api/tasks/my-tasks should be restricted to authority users", async () => {
      mockReq.userRole = "admin";

      await getMyTasks(mockReq, mockRes);

      // Admin should not be able to access my-tasks (only authority can)
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test("DELETE /api/tasks/:id should be accessible to admin (middleware-protected)", async () => {
      mockReq.userRole = "admin";
      mockReq.params = { id: "task001" };
      taskService.deleteTask.mockResolvedValue(undefined);

      await deleteTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== ERROR SCENARIOS ====================
  describe("Error Scenarios", () => {
    test("should handle database connection errors in getTasks gracefully", async () => {
      mockReq.query = {};
      taskService.getTasks.mockRejectedValue(new Error("Database connection failed"));

      await getTasks(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    test("should handle invalid ObjectId format for getTaskById", async () => {
      mockReq.params = { id: "not_a_valid_id" };
      taskService.getTaskById.mockRejectedValue(new Error("Invalid ObjectId"));

      await getTaskById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should log errors to console for getTaskById failures", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockReq.params = { id: "task001" };
      taskService.getTaskById.mockRejectedValue(new Error("Unexpected error"));

      await getTaskById(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("should handle service timeout gracefully in updateTaskStatus", async () => {
      mockReq.params = { id: "task001" };
      mockReq.body = { status: "completed" };
      taskService.updateTaskStatus.mockRejectedValue(new Error("Request timeout"));

      await updateTaskStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge Cases", () => {
    test("should handle task with no description gracefully", async () => {
      mockReq.body = {
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue"
        // no description
      };

      const createdTask = {
        _id: "task001",
        reportId: "report123",
        assignedTo: "authority456",
        title: "Fix Issue",
        description: undefined,
        status: "pending"
      };

      taskService.createTask.mockResolvedValue(createdTask);

      await createTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test("should pass cancellationReason trimmed to service", async () => {
      const updatedTask = { _id: "task001", status: "cancelled", cancellationReason: "Equipment failure" };

      mockReq.params = { id: "task001" };
      mockReq.body = { status: "cancelled", cancellationReason: "  Equipment failure  " };
      taskService.updateTaskStatus.mockResolvedValue(updatedTask);

      await updateTaskStatus(mockReq, mockRes);

      // Service receives the raw value; trimming happens inside the service
      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
        "task001",
        "cancelled",
        mockReq.userId,
        mockReq.userRole,
        "  Equipment failure  "
      );
    });

    test("should handle undefined dueDate in updateTask", async () => {
      const updatedTask = { _id: "task001", title: "Updated Title", dueDate: undefined };

      mockReq.params = { id: "task001" };
      mockReq.body = { title: "Updated Title" };
      taskService.updateTask.mockResolvedValue(updatedTask);

      await updateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should return count of 0 when no tasks match combined filters", async () => {
      taskService.getTasks.mockResolvedValue([]);
      mockReq.query = { status: "completed", priority: "high" };

      await getTasks(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 0, tasks: [] })
      );
    });
  });
});
