import cron from 'node-cron';
import AIConversation from '../ai/models/AIConversation';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import { cleanupOldAudioFiles } from '../ai/services/voiceService';

export const startCleanupJob = (): void => {
  // Run every Sunday at 2:00 AM Ethiopia time (11:00 PM Saturday UTC)
  cron.schedule('0 23 * * 0', async () => {
    console.log('🧹 Running weekly cleanup job...');

    try {
      // ── Clean up ended AI conversations older than 30 days ──
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedConversations = await AIConversation.deleteMany({
        isActive: false,
        endedAt: { $lt: thirtyDaysAgo },
      });

      console.log(
        `🗑️  Deleted ${deletedConversations.deletedCount} old AI conversation(s).`
      );

      // ── Clean up read notifications older than 30 days ──────
      const deletedNotifications = await Notification.deleteMany({
        isRead: true,
        createdAt: { $lt: thirtyDaysAgo },
      });

      console.log(
        `🗑️  Deleted ${deletedNotifications.deletedCount} old notification(s).`
      );

      // ── Clean up audit logs older than 90 days ───────────────
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedAuditLogs = await AuditLog.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        success: true,
        action: { $in: ['LOGIN', 'LOGOUT'] },
      });

      console.log(
        `🗑️  Deleted ${deletedAuditLogs.deletedCount} old login/logout audit log(s).`
      );

      // ── Clean up old voice audio files ───────────────────────
      try {
        cleanupOldAudioFiles();
        console.log('🗑️  Old voice audio files cleaned up.');
      } catch {
        console.error('⚠️  Failed to clean up audio files.');
      }

      console.log('✅ Weekly cleanup job completed successfully.');
    } catch (error) {
      console.error('❌ Cleanup job failed:', error);
    }
  });

  console.log('✅ Cleanup job scheduled — runs every Sunday at 2:00 AM');
};
