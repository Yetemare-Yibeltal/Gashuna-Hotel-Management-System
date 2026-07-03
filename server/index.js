const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// ── IMPORT CONFIGS ────────────────────────────────────────────────────────────
const connectDB = require('./config/db');
const { verifyCloudinaryConfig } = require('./config/cloudinary');
const { verifyEmailConfig } = require('./config/email');
const { initializeSocket } = require('./config/socket');

// ── IMPORT MIDDLEWARE ─────────────────────────────────────────────────────────
const { corsMiddleware, helmetMiddleware, handlePreflight } = require('./middleware/cors');
const { globalLimiter } = require('./middleware/rateLimiter');
const {
  mongoSanitizeMiddleware,
  xssSanitizeMiddleware,
  hppMiddleware,
  validateRequestSize,
  detectSuspiciousActivity,
  validateContentType,
  trimBodyStrings,
} = require('./middleware/sanitize');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ── IMPORT ROUTES ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const savedPropertyRoutes = require('./routes/savedPropertyRoutes');
const savedSearchRoutes = require('./routes/savedSearchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const contractRoutes = require('./routes/contractRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const landlordRoutes = require('./routes/landlordRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const blogRoutes = require('./routes/blogRoutes');
const faqRoutes = require('./routes/faqRoutes');

// ── IMPORT UTILS ──────────────────────────────────────────────────────────────
const logger = require('./utils/logger');

// ── CREATE EXPRESS APP ────────────────────────────────────────────────────────
const app = express();

// ── CREATE HTTP SERVER (required for Socket.io) ───────────────────────────────
const httpServer = http.createServer(app);

// ── INITIALIZE SOCKET.IO ──────────────────────────────────────────────────────
initializeSocket(httpServer);

// ── TRUST PROXY ───────────────────────────────────────────────────────────────
// Required when running behind Nginx, Railway, Render, or Vercel proxy
// Allows Express to correctly read client IP from X-Forwarded-For header
app.set('trust proxy', 1);

// ── SECURITY MIDDLEWARE (applied first, before anything else) ─────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.options('*', handlePreflight); // Handle all preflight OPTIONS requests

// ── COMPRESSION ───────────────────────────────────────────────────────────────
// Compress all responses to reduce bandwidth
app.use(
  compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Do not compress responses that have no-transform header
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// ── REQUEST LOGGING ───────────────────────────────────────────────────────────
// Use Morgan for HTTP request logging, piped through Winston
if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      stream: logger.stream,
    })
  );
} else {
  // In production, use combined format for more detailed logs
  app.use(
    morgan('combined', {
      stream: logger.stream,
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
    })
  );
}

// ── BODY PARSING ──────────────────────────────────────────────────────────────
// Parse incoming JSON request bodies
app.use(
  express.json({
    limit: '10mb', // Max JSON body size
    strict: true,  // Only accept arrays and objects as root JSON
  })
);

// Parse URL-encoded form data
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Parse cookies (used for refresh token httpOnly cookie)
app.use(cookieParser(process.env.JWT_SECRET));

// ── SANITIZATION MIDDLEWARE ───────────────────────────────────────────────────
// Applied after body parsing, before routes
app.use(validateRequestSize);        // Check request size before processing
app.use(mongoSanitizeMiddleware);    // Strip MongoDB operators from input
app.use(xssSanitizeMiddleware);      // Escape HTML entities in all string input
app.use(hppMiddleware);              // Prevent HTTP parameter pollution
app.use(detectSuspiciousActivity);   // Log suspicious request patterns
app.use(validateContentType);        // Validate Content-Type headers
app.use(trimBodyStrings);            // Trim whitespace from string inputs

// ── GLOBAL RATE LIMITER ───────────────────────────────────────────────────────
// Applied to all /api/* routes as baseline protection
app.use('/api', globalLimiter);

// ── HEALTH CHECK ENDPOINT ─────────────────────────────────────────────────────
/**
 * GET /api/health
 * Used by deployment platforms (Railway, Render) to check if the server is up.
 * Returns server status, uptime, environment, and timestamp.
 * Does not require authentication.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NestFind API is running',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// ── API INFO ENDPOINT ─────────────────────────────────────────────────────────
/**
 * GET /api
 * Returns basic API information and available route groups.
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NestFind API',
    version: '1.0.0',
    description: "Ethiopia's premier house rental management system API",
    documentation: `${process.env.CLIENT_URL}/api-docs`,
    routes: {
      auth: '/api/auth',
      properties: '/api/properties',
      tenant: {
        savedProperties: '/api/tenant/saved-properties',
        savedSearches: '/api/tenant/saved-searches',
        bookings: '/api/tenant/bookings',
        rentals: '/api/tenant/rentals',
        contracts: '/api/tenant/contracts',
        payments: '/api/tenant/payments',
        maintenance: '/api/tenant/maintenance',
      },
      landlord: '/api/landlord',
      admin: '/api/admin',
      messages: '/api/messages',
      notifications: '/api/notifications',
      blog: '/api/blog',
      faq: '/api/faq',
    },
  });
});

// ── MOUNT ROUTES ──────────────────────────────────────────────────────────────

// Auth routes (register, login, OTP, reset password)
app.use('/api/auth', authRoutes);

// Public property routes (listings, search, details)
app.use('/api/properties', propertyRoutes);

// Public blog routes (read-only for public)
app.use('/api/blog', blogRoutes);

// Public FAQ routes (read-only for public)
app.use('/api/faq', faqRoutes);

// Tenant routes (protected — tenant role only)
app.use('/api/tenant/saved-properties', savedPropertyRoutes);
app.use('/api/tenant/saved-searches', savedSearchRoutes);
app.use('/api/tenant/bookings', bookingRoutes);
app.use('/api/tenant/rentals', rentalRoutes);
app.use('/api/tenant/contracts', contractRoutes);
app.use('/api/tenant/payments', paymentRoutes);
app.use('/api/tenant/maintenance', maintenanceRoutes);

// Landlord routes (protected — landlord role only)
app.use('/api/landlord', landlordRoutes);

// Admin routes (protected — admin role only)
app.use('/api/admin', adminRoutes);

// Messaging routes (protected — all authenticated users)
app.use('/api/messages', messageRoutes);

// Notification routes (protected — all authenticated users)
app.use('/api/notifications', notificationRoutes);

// ── SERVE STATIC FILES IN PRODUCTION ─────────────────────────────────────────
/**
 * In production, serve the built React frontend from server.
 * In development, React is served by Vite on a separate port.
 */
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');

  app.use(express.static(clientBuildPath, {
    maxAge: '1y',         // Cache static assets for 1 year
    etag: true,
    lastModified: true,
  }));

  // Serve index.html for all non-API routes (React Router handles client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── 404 HANDLER ───────────────────────────────────────────────────────────────
// Must come AFTER all routes but BEFORE error handler
app.use(notFoundHandler);

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
// Must be the LAST middleware — Express identifies it by the 4-param signature
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Verify third-party service connections (non-blocking warnings)
    await verifyCloudinaryConfig();
    await verifyEmailConfig();

    // 3. Start listening
    httpServer.listen(PORT, HOST, () => {
      logger.info('═══════════════════════════════════════════');
      logger.info('  🏠  NestFind API Server Started');
      logger.info('═══════════════════════════════════════════');
      logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Port        : ${PORT}`);
      logger.info(`  Host        : ${HOST}`);
      logger.info(`  API URL     : http://${HOST}:${PORT}/api`);
      logger.info(`  Health      : http://${HOST}:${PORT}/api/health`);
      logger.info(`  Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      logger.info('═══════════════════════════════════════════');
    });

    // ── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────
    // Handle process termination signals properly
    // Closes server and DB connection before exiting
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (err) {
          logger.error(`Error closing MongoDB connection: ${err.message}`);
        }

        logger.info('NestFind server shut down cleanly');
        process.exit(0);
      });

      // Force exit if graceful shutdown takes more than 15 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ── UNHANDLED ERRORS ─────────────────────────────────────────────────────
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
      // Don't crash in development, crash in production (let process manager restart)
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
      });
      // Always crash on uncaught exceptions — let process manager restart
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, httpServer };
