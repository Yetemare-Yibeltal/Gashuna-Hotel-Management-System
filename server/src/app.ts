// server/src/app.ts
// ─────────────────────────────────────────────────────────────
// EXPRESS APPLICATION SETUP — Gashuna Hotel Management System
//
// This file creates and configures the Express app.
// It sets up all middleware and mounts all API routes.
// It does NOT start the server — server.ts does that.
// ─────────────────────────────────────────────────────────────

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

// ── Import Middleware ─────────────────────────────────────────
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { apiLimiter } from './middleware/rateLimiter';

// ── Import Routes ─────────────────────────────────────────────
// These will be uncommented as we build each module
// import authRoutes from './routes/authRoutes';
// import roomRoutes from './routes/roomRoutes';
// import guestRoutes from './routes/guestRoutes';
// import bookingRoutes from './routes/bookingRoutes';
// import invoiceRoutes from './routes/invoiceRoutes';
// import paymentRoutes from './routes/paymentRoutes';
// import menuRoutes from './routes/menuRoutes';
// import foodOrderRoutes from './routes/foodOrderRoutes';
// import staffRoutes from './routes/staffRoutes';
// import attendanceRoutes from './routes/attendanceRoutes';
// import payrollRoutes from './routes/payrollRoutes';
// import inventoryRoutes from './routes/inventoryRoutes';
// import serviceRoutes from './routes/serviceRoutes';
// import serviceRequestRoutes from './routes/serviceRequestRoutes';
// import housekeepingRoutes from './routes/housekeepingRoutes';
// import maintenanceRoutes from './routes/maintenanceRoutes';
// import reportRoutes from './routes/reportRoutes';
// import notificationRoutes from './routes/notificationRoutes';
// import dashboardRoutes from './routes/dashboardRoutes';
// import settingsRoutes from './routes/settingsRoutes';
// import uploadRoutes from './routes/uploadRoutes';

// ── Create Express App ────────────────────────────────────────
const app: Application = express();

// ── Security Middleware ───────────────────────────────────────
// Helmet sets secure HTTP headers to protect against
// common attacks like XSS, clickjacking, etc.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS Configuration ────────────────────────────────────────
// Allows the React frontend to make requests to this API
// In development: http://localhost:5173 (Vite dev server)
// In production: the deployed frontend URL
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, Thunder Client)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow origin: ${origin}`));
      }
    },
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request Logging ───────────────────────────────────────────
// Morgan logs every incoming request during development
// Format: METHOD /path STATUS responseTime ms
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Body Parsing Middleware ───────────────────────────────────
// Parse incoming JSON request bodies
// limit: 10mb allows for image uploads as base64
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie Parser ─────────────────────────────────────────────
// Allows reading cookies from requests
// Used for JWT authentication tokens
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────────
// Limits each IP to 100 requests per 15 minutes
// Protects against brute force attacks and DDoS
app.use('/api', apiLimiter);

// ── Static Files ──────────────────────────────────────────────
// Serve uploaded files (room images, staff photos etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────
// Simple endpoint to verify the server is running
// Used by deployment platforms and monitoring tools
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Gashuna Hotel API is running',
    hotel: process.env.HOTEL_NAME || 'Gashuna Hotel',
    location: 'Dangla, Awi Zone, Amhara Region, Ethiopia',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
  });
});

// ── API Routes ────────────────────────────────────────────────
// All routes are prefixed with /api
// Routes are mounted here as each module is built
// app.use('/api/auth', authRoutes);
// app.use('/api/rooms', roomRoutes);
// app.use('/api/guests', guestRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/menu', menuRoutes);
// app.use('/api/food-orders', foodOrderRoutes);
// app.use('/api/staff', staffRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/payroll', payrollRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/service-requests', serviceRequestRoutes);
// app.use('/api/housekeeping', housekeepingRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/upload', uploadRoutes);

// ── 404 Handler ───────────────────────────────────────────────
// If no route matched, return a 404 error
// This must come AFTER all routes
app.use(notFound);

// ── Global Error Handler ──────────────────────────────────────
// Catches all errors thrown anywhere in the application
// and returns a clean JSON error response
// This must be the LAST middleware
app.use(errorHandler);

export default app;
