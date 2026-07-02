// server/src/routes/authRoutes.ts
// ─────────────────────────────────────────────────────────────
// AUTH ROUTES — Gashuna Hotel Management System
//
// All routes are prefixed with /api/auth (set in app.ts)
//
// Public routes (no authentication required):
//   POST /api/auth/login
//   POST /api/auth/forgot-password
//   PUT  /api/auth/reset-password/:token
//
// Private routes (JWT token required):
//   POST /api/auth/logout
//   GET  /api/auth/me
//   PUT  /api/auth/change-password
//   PUT  /api/auth/update-profile
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Public Routes ─────────────────────────────────────────────
// Apply strict rate limiting to login to prevent brute force
router.post('/login', authLimiter, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ── Private Routes ────────────────────────────────────────────
// All routes below require a valid JWT token
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

export default router;
