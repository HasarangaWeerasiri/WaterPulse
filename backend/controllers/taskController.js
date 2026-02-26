import taskService from '../services/taskService.js';

/**
 * Task Controller - Handles HTTP requests for task management
 * Follows Single Responsibility Principle
 */

/**
 * Create a new task
 * POST /api/tasks
 * Body: { reportId, assignedTo, priority, title, description, dueDate }
 */
export const createTask = async (req, res) => {
  try {
    const { reportId, assignedTo, priority, title, description, dueDate } = req.body;

    // Validate required fields
    if (!reportId || !assignedTo || !title) {
      return res.status(400).json({
        message: 'Missing required fields: reportId, assignedTo, and title are required'
      });
    }

    // Validate priority
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        message: 'Invalid priority. Must be: low, medium, or high'
      });
    }

    // Create task with admin user ID from token
    const task = await taskService.createTask({
      reportId,
      assignedTo,
      assignedBy: req.userId,
      priority: priority || 'medium',
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({
      message: error.message || 'Failed to create task',
      error: error.message
    });
  }
};

/**
 * Get all tasks with optional filters
 * GET /api/tasks?assignedTo=userId&status=pending&priority=high
 */
export const getTasks = async (req, res) => {
  try {
    const filters = {
      assignedTo: req.query.assignedTo,
      status: req.query.status,
      priority: req.query.priority,
      reportId: req.query.reportId
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const tasks = await taskService.getTasks(filters);

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    res.status(200).json({
      message: 'Task retrieved successfully',
      task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    const statusCode = error.message === 'Task not found' ? 404 : 500;
    res.status(statusCode).json({
      message: error.message || 'Server error',
      error: error.message
    });
  }
};

/**
 * Get tasks assigned to current authority user
 * GET /api/tasks/my-tasks
 */
export const getMyTasks = async (req, res) => {
  try {
    // Only authorities can access their own tasks
    if (req.userRole !== 'authority') {
      return res.status(403).json({
        message: 'Only authority users can access their assigned tasks'
      });
    }

    const status = req.query.status || null;
    const tasks = await taskService.getTasksByAuthority(req.userId, status);

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update task status
 * PUT /api/tasks/:id/status
 * Body: { status }
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await taskService.updateTaskStatus(req.params.id, status, req.userId, req.userRole, cancellationReason);

    res.status(200).json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    const statusCode =
      error.message === 'Task not found'              ? 404 :
      error.message.startsWith('Forbidden')           ? 403 : 500;
    res.status(statusCode).json({
      message: error.message || 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a task's editable fields (admin only)
 * PUT /api/tasks/:id
 * Body: { title, description, priority, dueDate, assignedTo }
 */
export const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;

    const task = await taskService.updateTask(req.params.id, {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
    });

    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    const statusCode =
      error.message === 'Task not found'              ? 404 :
      error.message.includes('Invalid priority')      ? 400 :
      error.message.includes('authority users')        ? 400 : 500;
    res.status(statusCode).json({
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

/**
 * Permanently delete a task (admin only)
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    const statusCode = error.message === 'Task not found' ? 404 : 500;
    res.status(statusCode).json({
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get all authorities (for admin task assignment)
 * GET /api/tasks/authorities
 */
export const getAuthorities = async (req, res) => {
  try {
    const authorities = await taskService.getAuthorities();

    res.status(200).json({
      message: 'Authorities retrieved successfully',
      count: authorities.length,
      authorities
    });
  } catch (error) {
    console.error('Get authorities error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
