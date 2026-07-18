import cron from 'node-cron';
import Booking from '../models/Booking';
import Notification from '../models/Notification';
import User from '../models/User';

export const startReminderJob = (): void => {
  // Run every day at 7:00 AM Ethiopia time (UTC+3 = 4:00 AM UTC)
  cron.schedule('0 4 * * *', async () => {
    console.log('⏰ Running daily reminder job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // ── Today's check-ins ──────────────────────────────────
      const todayCheckIns = await Booking.find({
        checkIn: { $gte: today, $lte: todayEnd },
        status: 'confirmed',
      })
        .populate('guest', 'fullName phone vip')
        .populate('room', 'name roomNumber');

      // ── Today's check-outs ─────────────────────────────────
      const todayCheckOuts = await Booking.find({
        checkOut: { $gte: today, $lte: todayEnd },
        status: 'checked_in',
      })
        .populate('guest', 'fullName phone')
        .populate('room', 'name roomNumber');

      // ── Tomorrow's check-ins ───────────────────────────────
      const tomorrowCheckIns = await Booking.find({
        checkIn: { $gte: tomorrow, $lte: tomorrowEnd },
        status: 'confirmed',
      })
        .populate('guest', 'fullName phone vip')
        .populate('room', 'name roomNumber');

      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const adminUser of adminUsers) {
        if (todayCheckIns.length > 0) {
          await Notification.createNotification({
            recipient: adminUser._id,
            type: 'info',
            event: 'CHECKIN_DUE',
            title: `📅 Today's Check-ins — ${todayCheckIns.length} guest(s)`,
            message: `${todayCheckIns.length} guest(s) are checking in today. ${todayCheckIns.filter((b) => (b.guest as { vip?: boolean })?.vip).length} VIP guest(s).`,
            link: '/admin/reservations',
          });
        }

        if (todayCheckOuts.length > 0) {
          await Notification.createNotification({
            recipient: adminUser._id,
            type: 'info',
            event: 'CHECKOUT_DUE',
            title: `📅 Today's Check-outs — ${todayCheckOuts.length} guest(s)`,
            message: `${todayCheckOuts.length} guest(s) are checking out today.`,
            link: '/admin/reservations',
          });
        }

        if (tomorrowCheckIns.length > 0) {
          await Notification.createNotification({
            recipient: adminUser._id,
            type: 'info',
            event: 'CHECKIN_DUE',
            title: `📅 Tomorrow's Check-ins — ${tomorrowCheckIns.length} guest(s)`,
            message: `${tomorrowCheckIns.length} guest(s) are checking in tomorrow. Prepare rooms accordingly.`,
            link: '/admin/reservations',
          });
        }
      }

      // ── Mark no-show bookings ──────────────────────────────
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const noShowBookings = await Booking.find({
        checkIn: { $lt: today },
        status: 'confirmed',
      });

      for (const booking of noShowBookings) {
        booking.status = 'no_show';
        await booking.save();
      }

      if (noShowBookings.length > 0) {
        console.log(`📋 Marked ${noShowBookings.length} booking(s) as no-show.`);
      }

      console.log(`✅ Reminder job completed. Check-ins: ${todayCheckIns.length}, Check-outs: ${todayCheckOuts.length}`);
    } catch (error) {
      console.error('❌ Reminder job failed:', error);
    }
  });

  console.log('✅ Reminder job scheduled — runs daily at 7:00 AM');
};
