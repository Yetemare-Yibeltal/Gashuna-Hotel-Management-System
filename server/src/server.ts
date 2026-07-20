import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { startReminderJob } from './jobs/reminderJob';
import { startInventoryAlertJob } from './jobs/inventoryAlertJob';
import { startReportJob } from './jobs/reportJob';
import { startCleanupJob } from './jobs/cleanupJob';
import { startPayrollJob } from './jobs/payrollJob';

const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// ── Socket.IO Setup ───────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      CLIENT_URL,
      'https://gashuna.com',
      'https://www.gashuna.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Socket.IO Events ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-admin', (userId: string) => {
    socket.join(`admin-${userId}`);
    console.log(`👤 Admin ${userId} joined room`);
  });

  socket.on('join-room-board', () => {
    socket.join('room-board');
    console.log(`🏨 Client joined room board`);
  });

  socket.on('join-housekeeping', () => {
    socket.join('housekeeping');
    console.log(`🧹 Client joined housekeeping board`);
  });

  socket.on('join-kitchen', () => {
    socket.join('kitchen');
    console.log(`🍽️  Client joined kitchen orders`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Export Socket.IO instance for use in controllers ──────────
export { io };

// ── Start Server ──────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start scheduled jobs
    startReminderJob();
    startInventoryAlertJob();
    startReportJob();
    startCleanupJob();
    startPayrollJob();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🏨  GASHUNA HOTEL MANAGEMENT SYSTEM');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  📍  Hotel: Gashuna Hotel — Dangla, Ethiopia`);
      console.log(`  🌐  Server: http://localhost:${PORT}`);
      console.log(`  🔗  Health: http://localhost:${PORT}/health`);
      console.log(`  🤖  AI: http://localhost:${PORT}/api/ai/health`);
      console.log(`  ⚡  Socket.IO: enabled`);
      console.log(`  🌍  Environment: ${process.env.NODE_ENV}`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ── Handle Unhandled Rejections ───────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// ── Handle Uncaught Exceptions ────────────────────────────────
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

startServer();
