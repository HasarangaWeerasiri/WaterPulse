import Task from '../models/task.js';
import ContaminationReport from '../models/contaminationReport.js';
import User from '../models/user.js';
import notificationService from './notificationService.js';

/**
 * Task Service - Handles business logic for task management
 * Follows Single Responsibility Principle
 */
class TaskService {
  /**
   * Create a new task linked to a report
   * @param {Object} taskData - Task creation data
   * @param {string} taskData.reportId - ID of the contamination report
   * @param {string} taskData.assignedTo - ID of the authority user
   * @param {string} taskData.assignedBy - ID of the admin user
   * @param {string} taskData.priority - Priority level (low, medium, high)
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description
   * @param {Date} taskData.dueDate - Optional due date
   * @returns {Promise<Object>} Created task with populated fields
   */
  async createTask(taskData) {
    try {
      const { reportId, assignedTo, assignedBy, priority, title, description, dueDate } = taskData;

      // Validate report exists
      const report = await ContaminationReport.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Pre-creation check: cannot assign a task to an already resolved report
      if (report.status === 'Resolved') {
        throw new Error('Cannot create a task for a report that is already Resolved');
      }

      // Prevent duplicate assignment: check if an active (non-cancelled) task already exists for this report
      const existingTask = await Task.findOne({ reportId, status: { $ne: 'cancelled' } });
      if (existingTask) {
        throw new Error('This report is already assigned as an active task and cannot be assigned again');
      }

      // Validate assigned user exists and is an authority
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }
      if (assignedUser.role !== 'authority') {
        throw new Error('Task can only be assigned to authority users');
      }

      // Validate assignedBy user exists and is an admin
      const adminUser = await User.findById(assignedBy);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }
      if (adminUser.role !== 'admin') {
        throw new Error('Only admins can create tasks');
      }

      // Create task
      const task = new Task({
        reportId,
        assignedTo,
        assignedBy,
        priority: priority || 'medium',
        title,
        description,
        dueDate
      });

      await task.save();

      // When a task team is assigned, move report into "In Progress" so the
      // citizen gets immediate feedback (but don't override already-final states).
      if (report.status === 'Unverified') {
        await ContaminationReport.findByIdAndUpdate(reportId, { status: 'In Progress' });
      }

      // Populate related fields (reportedBy nested for citizen notification)
      await task.populate([
        {
          path: 'reportId',
          select: 'title description status address reportedBy',
          populate: { path: 'reportedBy', select: 'firstName lastName email' }
        },
        { path: 'assignedTo', select: 'firstName lastName email location' },
        { path: 'assignedBy', select: 'firstName lastName email' }
      ]);

      // Fire-and-forget: email failure must never block task creation
      notificationService.notifyTaskAssigned(task).catch((err) =>
        console.error('[TaskService] notifyTaskAssigned failed silently:', err.message)
      );

      return task;
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Get all tasks with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.assignedTo - Filter by assigned authority
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @param {string} filters.reportId - Filter by report ID
   * @returns {Promise<Array>} Array of tasks with populated fields
   */
  async getTasks(filters = {}) {
    try {
      const query = {};

      if (filters.assignedTo) {
        query.assignedTo = filters.assignedTo;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.reportId) {
        query.reportId = filters.reportId;
      }

      const tasks = await Task.find(query)
        .populate('reportId', 'title description status address createdAt')
        .populate('assignedTo', 'firstName lastName email location')
        .populate('assignedBy', 'firstName lastName email')
        .sort({ priority: -1, createdAt: -1 }); // High priority first, then by creation date

      return tasks;
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  /**
   * Get a single task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task with populated fields
   */
  async getTaskById(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('reportId', 'title description status address imageUrl location createdAt')
        .populate('assignedTo', 'firstName lastName email phoneNumber location')
        .populate('assignedBy', 'firstName lastName email');

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
  }

  /**
   * Get tasks assigned to a specific authority
   * @param {string} authorityId - Authority user ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Array of tasks
   */
  async getTasksByAuthority(authorityId, status = null) {
    try {
      const query = { assignedTo: authorityId };
      if (status) {
        query.status = status;
      }

      const tasks = await Task.find(query)
        .populate('reportId', 'title description status address createdAt')
        .populate('assignedBy', 'firstName lastName email')
        .sort({ priority: -1, createdAt: -1 });

      return tasks;
    } catch (error) {
      throw new Error(`Failed to fetch tasks for authority: ${error.message}`);
    }
  }

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @param {string} requestingUserId - ID of the user making the request
   * @param {string} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} Updated task
   */
  async updateTaskStatus(taskId, status, requestingUserId, requestingUserRole, cancellationReason = null) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Authorities may only update tasks that are assigned to them (SRP: ownership rule)
    if (requestingUserRole === 'authority' && task.assignedTo.toString() !== requestingUserId) {
      throw new Error('Forbidden: You can only update tasks assigned to you');
    }

    // Cancellation handling based on role
    if (status === 'cancelled') {
      // Authority users MUST provide a cancellation reason
      if (requestingUserRole === 'authority') {
        if (!cancellationReason || cancellationReason.trim() === '') {
          throw new Error('A cancellation reason is required when cancelling a task');
        }
        task.cancellationReason = cancellationReason.trim();
      }
      // Admin users can cancel without providing a reason
      else if (requestingUserRole === 'admin' && cancellationReason) {
        task.cancellationReason = cancellationReason.trim();
      }

      // Track which role cancelled the task
      task.cancelledByRole = requestingUserRole;

      // Restore the linked report back to Unverified (Pending Reports)
      // only if it's currently "In Progress" (avoid reverting resolved/confirmed reports).
      await ContaminationReport.findOneAndUpdate(
        { _id: task.reportId, status: 'In Progress' },
        { status: 'Unverified' }
      );
    }

    // Keep the report in "In Progress" when the task enters in_progress.
    if (status === 'in_progress') {
      await ContaminationReport.findOneAndUpdate(
        { _id: task.reportId, status: 'Unverified' },
        { status: 'In Progress' }
      );
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    // Populate related fields (email included for notifications)
    await task.populate([
      {
        path: 'reportId',
        select: 'title description status address reportedBy',
        populate: { path: 'reportedBy', select: 'firstName lastName email' }
      },
      { path: 'assignedTo', select: 'firstName lastName email location' },
      { path: 'assignedBy', select: 'firstName lastName email' }
    ]);

    // Fire-and-forget: email failure must never block status updates
    notificationService.notifyTaskStatusUpdated(task).catch((err) =>
      console.error('[TaskService] notifyTaskStatusUpdated failed silently:', err.message)
    );

    return task;
  }

  /**
   * Update a task's editable fields (admin only)
   * @param {string} taskId   - Task ID
   * @param {Object} updates  - Fields to update: title, description, priority, dueDate, assignedTo
   * @returns {Promise<Object>} Updated and populated task
   */
  async updateTask(taskId, updates) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');

    const { title, description, priority, dueDate, assignedTo, resolutionNotes } = updates;

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      throw new Error('Invalid priority. Must be: low, medium, or high');
    }

    // Validate new assignee if reassigning
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) throw new Error('Assigned user not found');
      if (user.role !== 'authority') throw new Error('Task can only be assigned to authority users');
      task.assignedTo = assignedTo;
    }

    if (title            !== undefined) task.title            = title;
    if (description      !== undefined) task.description      = description;
    if (priority         !== undefined) task.priority         = priority;
    if (dueDate          !== undefined) task.dueDate          = dueDate ? new Date(dueDate) : undefined;
    if (resolutionNotes  !== undefined) task.resolutionNotes  = resolutionNotes;

    await task.save();
    await task.populate([
      { path: 'reportId',   select: 'title description status address' },
      { path: 'assignedTo', select: 'firstName lastName email location' },
      { path: 'assignedBy', select: 'firstName lastName email' }
    ]);

    return task;
  }

  /**
   * Permanently delete a task (admin only)
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');

    // Restore the linked report back to Unverified so it reappears in Pending Reports
    await ContaminationReport.findByIdAndUpdate(task.reportId, { status: 'Unverified' });

    await task.deleteOne();
  }

  /**
   * Get all authorities (for task assignment dropdown)
   * @returns {Promise<Array>} Array of authority users
   */
  async getAuthorities() {
    try {
      const authorities = await User.find({ role: 'authority' })
        .select('firstName lastName email location')
        .sort({ lastName: 1, firstName: 1 });

      return authorities;
    } catch (error) {
      throw new Error(`Failed to fetch authorities: ${error.message}`);
    }
  }
}

export default new TaskService();
