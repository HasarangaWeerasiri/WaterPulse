import taskService from "../../../services/taskService.js";
import Task from "../../../models/task.js";
import ContaminationReport from "../../../models/contaminationReport.js";
import User from "../../../models/user.js";
import notificationService from "../../../services/notificationService.js";

// Mock the models and services
jest.mock("../../../models/task.js");
jest.mock("../../../models/contaminationReport.js");
jest.mock("../../../models/user.js");
jest.mock("../../../services/notificationService.js");

describe("TaskService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE TASK ====================
  describe("createTask", () => {
    const mockAdminId   = "66a0000000000000000000aa";
    const mockAuthorId  = "66a0000000000000000000bb";
    const mockReportId  = "66a0000000000000000000cc";

    const mockReport = {
      _id: mockReportId,
      status: "Unverified",
      title: "Water Issue"
    };

    const mockAuthorityUser = {
      _id: mockAuthorId,
      firstName: "Alice",
      lastName: "Smith",
      role: "authority"
    };

    const mockAdminUser = {
      _id: mockAdminId,
      firstName: "Bob",
      lastName: "Jones",
      role: "admin"
    };

    test("should create a task successfully with all required fields", async () => {
      const mockTask = {
        _id: "task001",
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        priority: "high",
        title: "Fix Water Issue",
        description: "Investigate immediately",
        status: "pending",
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null); // No existing task
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce(mockAdminUser);
      Task.mockImplementation(() => mockTask);
      ContaminationReport.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskAssigned = jest.fn().mockResolvedValue({});

      const result = await taskService.createTask({
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        priority: "high",
        title: "Fix Water Issue",
        description: "Investigate immediately"
      });

      expect(Task).toHaveBeenCalled();
      expect(mockTask.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test("should throw error when report does not exist", async () => {
      ContaminationReport.findById.mockResolvedValue(null);

      await expect(
        taskService.createTask({
          reportId: "nonexistent",
          assignedTo: mockAuthorId,
          assignedBy: mockAdminId,
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Report not found");
    });

    test("should throw error when report is already Resolved", async () => {
      ContaminationReport.findById.mockResolvedValue({
        ...mockReport,
        status: "Resolved"
      });

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: mockAuthorId,
          assignedBy: mockAdminId,
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Cannot create a task for a report that is already Resolved");
    });

    test("should throw error when an active task already exists for the report", async () => {
      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue({ _id: "existingTask", status: "pending" });

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: mockAuthorId,
          assignedBy: mockAdminId,
          title: "Duplicate Task"
        })
      ).rejects.toThrow("Failed to create task: This report is already assigned as an active task and cannot be assigned again");
    });

    test("should throw error when assigned user does not exist", async () => {
      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValueOnce(null); // assignedTo not found

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: "nonexistent_user",
          assignedBy: mockAdminId,
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Assigned user not found");
    });

    test("should throw error when assigned user is not an authority", async () => {
      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValueOnce({ ...mockAuthorityUser, role: "citizen" });

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: mockAuthorId,
          assignedBy: mockAdminId,
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Task can only be assigned to authority users");
    });

    test("should throw error when assignedBy user does not exist", async () => {
      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce(null); // admin not found

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: mockAuthorId,
          assignedBy: "nonexistent_admin",
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Admin user not found");
    });

    test("should throw error when assignedBy user is not an admin", async () => {
      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce({ ...mockAdminUser, role: "authority" });

      await expect(
        taskService.createTask({
          reportId: mockReportId,
          assignedTo: mockAuthorId,
          assignedBy: mockAdminId,
          title: "Test Task"
        })
      ).rejects.toThrow("Failed to create task: Only admins can create tasks");
    });

    test("should default priority to 'medium' when not provided", async () => {
      const mockTask = {
        _id: "task002",
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        priority: "medium",
        title: "Test Task",
        status: "pending",
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce(mockAdminUser);
      Task.mockImplementation(() => mockTask);
      ContaminationReport.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskAssigned = jest.fn().mockResolvedValue({});

      const result = await taskService.createTask({
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        title: "Test Task"
        // priority not provided
      });

      expect(result.priority).toBe("medium");
    });

    test("should update report status to 'In Progress' when report is 'Unverified'", async () => {
      const mockTask = {
        _id: "task003",
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        priority: "low",
        title: "Test Task",
        status: "pending",
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      ContaminationReport.findById.mockResolvedValue({ ...mockReport, status: "Unverified" });
      Task.findOne.mockResolvedValue(null);
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce(mockAdminUser);
      Task.mockImplementation(() => mockTask);
      const updateMock = jest.fn().mockResolvedValue({});
      ContaminationReport.findByIdAndUpdate = updateMock;
      notificationService.notifyTaskAssigned = jest.fn().mockResolvedValue({});

      await taskService.createTask({
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        title: "Test Task",
        priority: "low"
      });

      expect(updateMock).toHaveBeenCalledWith(mockReportId, { status: "In Progress" });
    });

    test("should not block task creation if notification fails", async () => {
      const mockTask = {
        _id: "task004",
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        priority: "medium",
        title: "Test Task",
        status: "pending",
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      ContaminationReport.findById.mockResolvedValue(mockReport);
      Task.findOne.mockResolvedValue(null);
      User.findById
        .mockResolvedValueOnce(mockAuthorityUser)
        .mockResolvedValueOnce(mockAdminUser);
      Task.mockImplementation(() => mockTask);
      ContaminationReport.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskAssigned = jest.fn().mockReturnValue(
        Promise.reject(new Error("Email service down"))
      );

      const result = await taskService.createTask({
        reportId: mockReportId,
        assignedTo: mockAuthorId,
        assignedBy: mockAdminId,
        title: "Test Task"
      });

      expect(result).toBeDefined();
    });
  });

  // ==================== GETTASKS ====================
  describe("getTasks", () => {
    test("should fetch all tasks without filters", async () => {
      const mockTasks = [
        { _id: "t1", title: "Task 1", priority: "high", status: "pending" },
        { _id: "t2", title: "Task 2", priority: "low",  status: "completed" }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasks({});

      expect(Task.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockTasks);
      expect(result.length).toBe(2);
    });

    test("should filter tasks by status", async () => {
      const mockTasks = [
        { _id: "t1", status: "pending" }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasks({ status: "pending" });

      expect(Task.find).toHaveBeenCalledWith({ status: "pending" });
      expect(result.every(t => t.status === "pending")).toBe(true);
    });

    test("should filter tasks by priority", async () => {
      const mockTasks = [
        { _id: "t1", priority: "high" },
        { _id: "t2", priority: "high" }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasks({ priority: "high" });

      expect(Task.find).toHaveBeenCalledWith({ priority: "high" });
      expect(result.every(t => t.priority === "high")).toBe(true);
    });

    test("should filter tasks by assignedTo", async () => {
      const authorityId = "66a0000000000000000000bb";
      const mockTasks = [
        { _id: "t1", assignedTo: authorityId }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasks({ assignedTo: authorityId });

      expect(Task.find).toHaveBeenCalledWith({ assignedTo: authorityId });
      expect(result.length).toBe(1);
    });

    test("should filter tasks by reportId", async () => {
      const reportId = "66a0000000000000000000cc";
      const mockTasks = [
        { _id: "t1", reportId }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasks({ reportId });

      expect(Task.find).toHaveBeenCalledWith({ reportId });
    });

    test("should sort tasks by priority descending then by createdAt descending", async () => {
      const sortMock = jest.fn().mockResolvedValue([]);

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: sortMock
      });

      await taskService.getTasks({});

      expect(sortMock).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
    });

    test("should throw error on database failure", async () => {
      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error("DB error"))
      });

      await expect(taskService.getTasks({})).rejects.toThrow("Failed to fetch tasks");
    });

    test("should return empty array when no tasks match filters", async () => {
      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await taskService.getTasks({ status: "completed" });

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  // ==================== GETTASKBYID ====================
  describe("getTaskById", () => {
    test("should fetch a single task by ID", async () => {
      const mockTask = {
        _id: "task001",
        title: "Fix Water Issue",
        status: "pending"
      };

      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      populateChain.populate.mockReturnValue(populateChain);
      populateChain.then = jest.fn(function (resolve) {
        resolve(mockTask);
        return this;
      });
      populateChain.catch = jest.fn().mockReturnThis();

      Task.findById.mockReturnValue(populateChain);

      const result = await taskService.getTaskById("task001");

      expect(Task.findById).toHaveBeenCalledWith("task001");
      expect(result).toEqual(mockTask);
    });

    test("should throw 'Task not found' error for non-existent task", async () => {
      const populateChain = {
        populate: jest.fn().mockReturnThis()
      };
      populateChain.populate.mockReturnValue(populateChain);
      populateChain.then = jest.fn(function (resolve) {
        resolve(null);
        return this;
      });
      populateChain.catch = jest.fn().mockReturnThis();

      Task.findById.mockReturnValue(populateChain);

      await expect(taskService.getTaskById("invalid_id")).rejects.toThrow("Failed to fetch task: Task not found");
    });
  });

  // ==================== GETTASKSBYAUTHORITY ====================
  describe("getTasksByAuthority", () => {
    const authorityId = "66a0000000000000000000bb";

    test("should fetch all tasks for a specific authority", async () => {
      const mockTasks = [
        { _id: "t1", assignedTo: authorityId, status: "pending" },
        { _id: "t2", assignedTo: authorityId, status: "in_progress" }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasksByAuthority(authorityId);

      expect(Task.find).toHaveBeenCalledWith({ assignedTo: authorityId });
      expect(result.length).toBe(2);
      expect(result.every(t => t.assignedTo === authorityId)).toBe(true);
    });

    test("should filter by status when status is provided", async () => {
      const mockTasks = [
        { _id: "t1", assignedTo: authorityId, status: "pending" }
      ];

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTasks)
      });

      const result = await taskService.getTasksByAuthority(authorityId, "pending");

      expect(Task.find).toHaveBeenCalledWith({ assignedTo: authorityId, status: "pending" });
      expect(result.every(t => t.status === "pending")).toBe(true);
    });

    test("should sort authority tasks by priority descending then by createdAt descending", async () => {
      const sortMock = jest.fn().mockResolvedValue([]);

      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: sortMock
      });

      await taskService.getTasksByAuthority(authorityId);

      expect(sortMock).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
    });

    test("should throw error on database failure for authority tasks", async () => {
      Task.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error("Connection lost"))
      });

      await expect(taskService.getTasksByAuthority(authorityId)).rejects.toThrow(
        "Failed to fetch tasks for authority"
      );
    });
  });

  // ==================== UPDATE TASK STATUS ====================
  describe("updateTaskStatus", () => {
    const taskId   = "task001";
    const adminId  = "66a0000000000000000000aa";
    const authorId = "66a0000000000000000000bb";
    const reportId = "66a0000000000000000000cc";

    const baseTask = {
      _id: taskId,
      reportId,
      assignedTo: { toString: () => authorId },
      status: "pending",
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined)
    };

    test("should update task status from pending to in_progress (admin)", async () => {
      Task.findById.mockResolvedValue({ ...baseTask });
      ContaminationReport.findOneAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskStatusUpdated = jest.fn().mockResolvedValue({});

      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);

      const result = await taskService.updateTaskStatus(taskId, "in_progress", adminId, "admin");

      expect(task.status).toBe("in_progress");
      expect(task.save).toHaveBeenCalled();
    });

    test("should update task status to completed and set completedAt", async () => {
      const task = {
        ...baseTask,
        completedAt: undefined,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);
      ContaminationReport.findOneAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskStatusUpdated = jest.fn().mockResolvedValue({});

      await taskService.updateTaskStatus(taskId, "completed", adminId, "admin");

      expect(task.status).toBe("completed");
      expect(task.completedAt).toBeDefined();
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    test("should throw error when task not found", async () => {
      Task.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus("nonexistent", "completed", adminId, "admin")
      ).rejects.toThrow("Task not found");
    });

    test("should throw Forbidden error when authority tries to update someone else's task", async () => {
      const otherAuthorId = "66a0000000000000000000dd";
      const task = {
        ...baseTask,
        assignedTo: { toString: () => otherAuthorId },
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);

      await expect(
        taskService.updateTaskStatus(taskId, "completed", authorId, "authority")
      ).rejects.toThrow("Forbidden: You can only update tasks assigned to you");
    });

    test("should require cancellation reason when authority cancels a task", async () => {
      const task = {
        ...baseTask,
        assignedTo: { toString: () => authorId },
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);

      await expect(
        taskService.updateTaskStatus(taskId, "cancelled", authorId, "authority", null)
      ).rejects.toThrow("A cancellation reason is required when cancelling a task");
    });

    test("should allow authority to cancel with a valid reason", async () => {
      const task = {
        ...baseTask,
        assignedTo: { toString: () => authorId },
        cancellationReason: undefined,
        cancelledByRole: undefined,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);
      ContaminationReport.findOneAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskStatusUpdated = jest.fn().mockResolvedValue({});

      await taskService.updateTaskStatus(taskId, "cancelled", authorId, "authority", "Equipment failure");

      expect(task.status).toBe("cancelled");
      expect(task.cancellationReason).toBe("Equipment failure");
      expect(task.cancelledByRole).toBe("authority");
    });

    test("should allow admin to cancel without a reason", async () => {
      const task = {
        ...baseTask,
        assignedTo: { toString: () => authorId },
        cancelledByRole: undefined,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);
      ContaminationReport.findOneAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskStatusUpdated = jest.fn().mockResolvedValue({});

      await taskService.updateTaskStatus(taskId, "cancelled", adminId, "admin");

      expect(task.status).toBe("cancelled");
      expect(task.cancelledByRole).toBe("admin");
    });

    test("should restore report to Unverified when task is cancelled", async () => {
      const task = {
        ...baseTask,
        assignedTo: { toString: () => authorId },
        cancelledByRole: undefined,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);
      const updateMock = jest.fn().mockResolvedValue({});
      ContaminationReport.findOneAndUpdate = updateMock;
      notificationService.notifyTaskStatusUpdated = jest.fn().mockResolvedValue({});

      await taskService.updateTaskStatus(taskId, "cancelled", adminId, "admin");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ _id: reportId }),
        { status: "Unverified" }
      );
    });

    test("should not block status update if notification fails", async () => {
      const task = {
        ...baseTask,
        assignedTo: { toString: () => authorId },
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined)
      };

      Task.findById.mockResolvedValue(task);
      ContaminationReport.findOneAndUpdate = jest.fn().mockResolvedValue({});
      notificationService.notifyTaskStatusUpdated = jest.fn().mockReturnValue(
        Promise.reject(new Error("Email service down"))
      );

      const result = await taskService.updateTaskStatus(taskId, "in_progress", adminId, "admin");

      expect(result).toBeDefined();
      expect(task.status).toBe("in_progress");
    });
  });

  // ==================== UPDATE TASK ====================
  describe("updateTask", () => {
    const taskId  = "task001";
    const authorId = "66a0000000000000000000bb";

    const baseTask = {
      _id: taskId,
      title: "Original Title",
      description: "Original Desc",
      priority: "medium",
      dueDate: undefined,
      resolutionNotes: undefined,
      assignedTo: authorId,
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined)
    };

    test("should update task title successfully", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);

      await taskService.updateTask(taskId, { title: "New Title" });

      expect(task.title).toBe("New Title");
      expect(task.save).toHaveBeenCalled();
    });

    test("should update task priority successfully", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);

      await taskService.updateTask(taskId, { priority: "high" });

      expect(task.priority).toBe("high");
    });

    test("should throw error for invalid priority value", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);

      await expect(
        taskService.updateTask(taskId, { priority: "critical" })
      ).rejects.toThrow("Invalid priority. Must be: low, medium, or high");
    });

    test("should throw error when updating a non-existent task", async () => {
      Task.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask("nonexistent", { title: "New Title" })
      ).rejects.toThrow("Task not found");
    });

    test("should update description and resolutionNotes", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);

      await taskService.updateTask(taskId, {
        description: "Updated description",
        resolutionNotes: "Issue resolved at site"
      });

      expect(task.description).toBe("Updated description");
      expect(task.resolutionNotes).toBe("Issue resolved at site");
    });

    test("should only reassign to existing authority users", async () => {
      const newAuthorId = "66a0000000000000000000dd";
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };

      Task.findById.mockResolvedValue(task);
      User.findById.mockResolvedValue({ _id: newAuthorId, role: "authority" });

      await taskService.updateTask(taskId, { assignedTo: newAuthorId });

      expect(task.assignedTo).toBe(newAuthorId);
    });

    test("should throw error when new assignee does not exist", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);
      User.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask(taskId, { assignedTo: "nonexistent_user" })
      ).rejects.toThrow("Assigned user not found");
    });

    test("should throw error when new assignee is not an authority", async () => {
      const task = { ...baseTask, save: jest.fn().mockResolvedValue(undefined), populate: jest.fn().mockResolvedValue(undefined) };
      Task.findById.mockResolvedValue(task);
      User.findById.mockResolvedValue({ _id: "user123", role: "citizen" });

      await expect(
        taskService.updateTask(taskId, { assignedTo: "user123" })
      ).rejects.toThrow("Task can only be assigned to authority users");
    });
  });

  // ==================== DELETE TASK ====================
  describe("deleteTask", () => {
    const taskId  = "task001";
    const reportId = "66a0000000000000000000cc";

    test("should delete a task successfully and restore report to Unverified", async () => {
      const deleteOneMock = jest.fn().mockResolvedValue({});
      const task = {
        _id: taskId,
        reportId,
        deleteOne: deleteOneMock
      };

      Task.findById.mockResolvedValue(task);
      ContaminationReport.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await taskService.deleteTask(taskId);

      expect(ContaminationReport.findByIdAndUpdate).toHaveBeenCalledWith(reportId, { status: "Unverified" });
      expect(deleteOneMock).toHaveBeenCalled();
    });

    test("should throw 'Task not found' when deleting non-existent task", async () => {
      Task.findById.mockResolvedValue(null);

      await expect(taskService.deleteTask("nonexistent")).rejects.toThrow("Task not found");
    });
  });

  // ==================== GET AUTHORITIES ====================
  describe("getAuthorities", () => {
    test("should fetch all authority users", async () => {
      const mockAuthorities = [
        { _id: "u1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", role: "authority" },
        { _id: "u2", firstName: "Bob",   lastName: "Jones", email: "bob@test.com",   role: "authority" }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAuthorities)
      });

      const result = await taskService.getAuthorities();

      expect(User.find).toHaveBeenCalledWith({ role: "authority" });
      expect(result.length).toBe(2);
    });

    test("should sort authorities alphabetically by last name then first name", async () => {
      const sortMock = jest.fn().mockResolvedValue([]);

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: sortMock
      });

      await taskService.getAuthorities();

      expect(sortMock).toHaveBeenCalledWith({ lastName: 1, firstName: 1 });
    });

    test("should return empty array when no authorities exist", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await taskService.getAuthorities();

      expect(result).toEqual([]);
    });

    test("should throw error on database failure for authorities", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error("DB Error"))
      });

      await expect(taskService.getAuthorities()).rejects.toThrow("Failed to fetch authorities");
    });
  });
});
