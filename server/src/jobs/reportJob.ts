import cron from 'node-cron';
import Invoice from '../models/Invoice';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Report from '../models/Report';
import Notification from '../models/Notification';
import User from '../models/User';
import { formatETB } from '../utils/formatCurrency';

export const startReportJob = (): void => {
  // Run on the 1st of every month at 6:00 AM Ethiopia time (3:00 AM UTC)
  cron.schedule('0 3 1 * *', async () => {
    console.log('📊 Running monthly report generation job...');

    try {
      const now = new Date();
      const lastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59
      );

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];

      const reportMonth = lastMonth.getMonth() + 1;
      const reportYear = lastMonth.getFullYear();
      const monthName = monthNames[lastMonth.getMonth()];

      // ── Revenue Data ───────────────────────────────────────
      const revenueData = await Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: lastMonth, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalVAT: { $sum: '$vatAmount' },
            totalSubtotal: { $sum: '$subtotal' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]);

      // ── Booking Data ───────────────────────────────────────
      const bookingData = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]);

      // ── Occupancy Data ─────────────────────────────────────
      const totalRooms = await Room.countDocuments({ isActive: true });
      const daysInMonth = lastMonthEnd.getDate();
      const totalRoomNights = totalRooms * daysInMonth;

      const occupancyData = await Booking.aggregate([
        {
          $match: {
            status: { $in: ['checked_in', 'checked_out'] },
            checkIn: { $lte: lastMonthEnd },
            checkOut: { $gte: lastMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalNights: { $sum: '$nights' },
          },
        },
      ]);

      const occupiedNights = occupancyData[0]?.totalNights || 0;
      const occupancyRate =
        totalRoomNights > 0
          ? Math.round((occupiedNights / totalRoomNights) * 100 * 10) / 10
          : 0;

      const totalRevenue = revenueData[0]?.totalRevenue || 0;
      const totalVAT = revenueData[0]?.totalVAT || 0;
      const adr =
        occupiedNights > 0
          ? Math.round((totalRevenue / occupiedNights) * 100) / 100
          : 0;

      // ── Payment Method Breakdown ───────────────────────────
      const paymentMethodData = await Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: lastMonth, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
        { $sort: { total: -1 } },
      ]);

      const reportData = {
        period: `${monthName} ${reportYear}`,
        month: reportMonth,
        year: reportYear,
        revenue: {
          total: totalRevenue,
          subtotal: revenueData[0]?.totalSubtotal || 0,
          vat: totalVAT,
          invoiceCount: revenueData[0]?.invoiceCount || 0,
          formattedTotal: formatETB(totalRevenue),
        },
        occupancy: {
          totalRooms,
          daysInMonth,
          totalRoomNights,
          occupiedNights,
          occupancyRate,
          adr,
          formattedADR: formatETB(adr),
        },
        bookingStats: bookingData,
        paymentMethods: paymentMethodData,
        generatedAutomatically: true,
      };

      // ── Find admin to assign as report generator ───────────
      const adminUser = await User.findOne({
        role: 'admin',
        isActive: true,
      });

      if (!adminUser) {
        console.error('❌ No admin user found to assign report to.');
        return;
      }

      // ── Save the report ────────────────────────────────────
      const report = await Report.create({
        title: `Automated Monthly Report — ${monthName} ${reportYear}`,
        type: 'revenue',
        period: 'monthly',
        startDate: lastMonth,
        endDate: lastMonthEnd,
        status: 'ready',
        reportData,
        summary: `Automated report for ${monthName} ${reportYear}. Total revenue: ${formatETB(totalRevenue)}. Occupancy rate: ${occupancyRate}%. ADR: ${formatETB(adr)}.`,
        generatedBy: adminUser._id,
        generatedAt: new Date(),
        totalRevenueETB: totalRevenue,
      });

      // ── Notify all admin users ─────────────────────────────
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const user of adminUsers) {
        await Notification.createNotification({
          recipient: user._id,
          type: 'info',
          event: 'GENERAL',
          title: `📊 Monthly Report Ready — ${monthName} ${reportYear}`,
          message: `The automated monthly report for ${monthName} ${reportYear} has been generated. Revenue: ${formatETB(totalRevenue)}, Occupancy: ${occupancyRate}%.`,
          link: `/admin/reports/${report._id}`,
        });
      }

      console.log(
        `✅ Monthly report generated for ${monthName} ${reportYear}. Revenue: ${formatETB(totalRevenue)}`
      );
    } catch (error) {
      console.error('❌ Report job failed:', error);
    }
  });

  console.log(
    '✅ Report job scheduled — runs on the 1st of every month at 6:00 AM'
  );
};
