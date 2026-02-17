import express from 'express';
import { register, login, createAdminOrAuthority, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/create-admin-authority', createAdminOrAuthority);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

export default router;
