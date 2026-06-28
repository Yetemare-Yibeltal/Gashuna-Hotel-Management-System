// server/src/server.ts
// ─────────────────────────────────────────────────────────────
// ENTRY POINT — Gashuna Hotel Management System Backend
//
// This is the first file that runs when you start the server.
// It loads env variables, connects to MongoDB, then starts
// the Express HTTP server.
//
// Start the server with: npm run dev (inside server/)
// ─────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.info('');
      console.info('═══════════════════════════════════════════════');
      console.info('   🏨  GASHUNA HOTEL MANAGEMENT SYSTEM');
      console.info('═══════════════════════════════════════════════');
      console.info(`   📍  Dangla, Awi Zone, Amhara Region, Ethiopia`);
      console.info(`   🚀  Server running on port ${PORT}`);
      console.info(`   🌍  Environment: ${process.env.NODE_ENV}`);
      console.info(`   🔗  URL: http://localhost:${PORT}`);
      console.info(`   📡  API: http://localhost:${PORT}/api`);
      console.info('═══════════════════════════════════════════════');
      console.info('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Promise Rejection:', reason.message);
  console.error('   Shutting down server...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('   Shutting down server...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.info('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.info('✅ Server closed.');
    process.exit(0);
  });
});
