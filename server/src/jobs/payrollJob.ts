import cron from 'node-cron';
import Staff from '../models/Staff';
import Attendance from '../models/Attendance';
import Payroll from '../models/Payroll';
import Notification from '../models/Notification';
import User from '../models/User';
import { formatETB } from '../utils/formatCurrency';

export const startPayrollJob = (): void => {
  // Run on the 25th of every month at 9:00 AM Ethiopia time (6:00 AM UTC)
  // Automatically generates draft payroll for review before month end
  cron.schedule('0 6 25 * *', async () => {
    console.log('💰 Running monthly payroll generation job...');

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // ── Check if payroll already generated ────────────────
      const existingPayroll = await Payroll.countDocuments({
        month: currentMonth,
        year: currentYear,
      });

      if (existingPayroll > 0) {
        console.log(
          `⚠️  Payroll for ${currentMonth}/${currentYear} already exists. Skipping.`
        );
        return;
      }

      // ── Get all active staff ──────────────────────────────
      const activeStaff = await Staff.find({ status: 'active' });

      if (activeStaff.length === 0) {
        console.log('⚠️  No active staff found for payroll generation.');
        return;
      }

      // ── Get attendance for current month ──────────────────
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);

      const payrollRecords = [];
      const errors = [];

      for (const staff of activeStaff) {
        try {
          const attendanceRecords = await Attendance.find({
            staff: staff._id,
            date: { $gte: startDate, $lte: endDate },
          });

          const daysWorked = attendanceRecords.filter(
            (r) =>
              r.status === 'present' ||
              r.status === 'late' ||
              r.status === 'half_day'
          ).length;

          const halfDays = attendanceRecords.filter(
            (r) => r.status === 'half_day'
          ).length;

          const daysAbsent = attendanceRecords.filter(
            (r) => r.status === 'absent'
          ).length;

          const dailyRate = staff.salary / 26;
          const absenceDeduction =
            Math.round(daysAbsent * dailyRate * 100) / 100;
          const halfDayDeduction =
            Math.round(halfDays * (dailyRate / 2) * 100) / 100;
          const totalDeductions = absenceDeduction + halfDayDeduction;

          const payroll = await Payroll.create({
            staff: staff._id,
            month: currentMonth,
            year: currentYear,
            baseSalary: staff.salary,
            bonuses: 0,
            deductions: totalDeductions,
            deductionReason:
              daysAbsent > 0 || halfDays > 0
                ? `${daysAbsent} absent day(s), ${halfDays} half day(s)`
                : undefined,
            advancesPaid: 0,
            netPay: 0,
            daysWorked,
            daysAbsent,
            status: 'draft',
          });

          payrollRecords.push(payroll);
        } catch (error) {
          errors.push({
            staffName: staff.fullName,
            error:
              error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const totalNetPay = payrollRecords.reduce(
        (sum, p) => sum + p.netPay,
        0
      );

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];

      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const adminUser of adminUsers) {
        await Notification.createNotification({
          recipient: adminUser._id,
          type: 'info',
          event: 'GENERAL',
          title: `💰 Draft Payroll Ready — ${monthNames[currentMonth - 1]} ${currentYear}`,
          message: `Draft payroll for ${monthNames[currentMonth - 1]} ${currentYear} has been generated for ${payrollRecords.length} staff member(s). Total net pay: ${formatETB(totalNetPay)}. Please review and approve.`,
          link: '/admin/payroll',
        });
      }

      console.log(
        `✅ Payroll job completed. ${payrollRecords.length} records generated. Total: ${formatETB(totalNetPay)}`
      );

      if (errors.length > 0) {
        console.error('⚠️  Errors during payroll generation:', errors);
      }
    } catch (error) {
      console.error('❌ Payroll job failed:', error);
    }
  });

  console.log(
    '✅ Payroll job scheduled — runs on the 25th of every month at 9:00 AM'
  );
};
