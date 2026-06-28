// server/src/config/db.ts
// ─────────────────────────────────────────────────────────────
// MONGODB CONNECTION — Gashuna Hotel Management System
//
// Connects to MongoDB using Mongoose.
// Has retry logic — tries up to 5 times before giving up.
// Listens for connection events and logs them clearly.
// Called once from server.ts before the server starts.
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

// ── Connection Options ────────────────────────────────────────
const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
};

// ── Retry Configuration ───────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// ── Connect to MongoDB ────────────────────────────────────────
export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.error('   Please add MONGODB_URI to your server/.env file');
    process.exit(1);
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.info(`🔄 Connecting to MongoDB... (attempt ${retries + 1}/${MAX_RETRIES})`);

      await mongoose.connect(mongoURI, MONGOOSE_OPTIONS);

      console.info('✅ MongoDB connected successfully');
      console.info(`   📦 Database: ${mongoose.connection.name}`);
      console.info(`   🖥️  Host: ${mongoose.connection.host}`);
      return;

    } catch (error) {
      retries++;

      if (error instanceof Error) {
        console.error(`❌ MongoDB connection attempt ${retries} failed:`);
        console.error(`   ${error.message}`);
      }

      if (retries >= MAX_RETRIES) {
        console.error(`❌ Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
        console.error('   Please check your MONGODB_URI in server/.env');
        process.exit(1);
      }

      console.info(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

// ── Disconnect from MongoDB ───────────────────────────────────
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.info('✅ MongoDB connection closed');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
    process.exit(1);
  }
};

// ── Connection Event Listeners ────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (error: Error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

mongoose.connection.on('open', () => {
  console.info('📂 MongoDB connection is open and ready');
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.info('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during MongoDB shutdown:', error);
    process.exit(1);
  }
});

export default mongoose;
