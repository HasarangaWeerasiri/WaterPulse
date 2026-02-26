import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  getMyTasks,
  updateTaskStatus,
  getAuthorities
} from '../controllers/taskController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all authorities (for admin task assignment dropdown)
router.get(
  '/authorities',
  verifyToken,
  checkRole(['admin']),
  getAuthorities
);

// Get tasks assigned to current authority user
router.get(
  '/my-tasks',
  verifyToken,
  checkRole(['authority']),
  getMyTasks
);

// Get all tasks (admin can see all, authority can see their own)
router.get(
  '/',
  verifyToken,
  getTasks
);

// Get a single task by ID
router.get(
  '/:id',
  verifyToken,
  getTaskById
);

// Create a new task (admin only)
router.post(
  '/',
  verifyToken,
  checkRole(['admin']),
  createTask
);

// Update task status (admin: any task | authority: own tasks only)
router.put(
  '/:id/status',
  verifyToken,
  checkRole(['admin', 'authority']),
  updateTaskStatus
);

export default router;
