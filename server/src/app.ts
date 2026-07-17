import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { apiLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorMiddleware';

import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import roomTypeRoutes from './routes/roomTypeRoutes';
import guestRoutes from './routes/guestRoutes';
import bookingRoutes from './routes/bookingRoutes';
import checkInRoutes from './routes/checkInRoutes';
import chapaRoutes from './routes/chapaRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import menuRoutes from './routes/menuRoutes';
import foodOrderRoutes from './routes/foodOrderRoutes';
import staffRoutes from './routes/staffRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import payrollRoutes from './routes/payrollRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import serviceRoutes from './routes/serviceRoutes';
import serviceRequestRoutes from './routes/serviceRequestRoutes';
import housekeepingRoutes from './routes/housekeepingRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingsRoutes from './routes/settingsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import aiRoutes from './routes/aiRoutes';

const app: Application = express();

// ── Security Middleware ───────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://gashuna.com',
      'https://www.gashuna.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-chapa-signature',
    ],
  })
);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate Limiting ─────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Static Files ──────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Gashuna Hotel API is running',
    hotel: 'Gashuna Hotel — Dangla, Ethiopia',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/chapa', chapaRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/food-orders', foodOrderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// ── Error Handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
