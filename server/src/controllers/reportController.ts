import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Report from '../models/Report';
import Booking from '../models/Booking';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Room from '../models/Room';
import Guest from '../models/Guest';
import Staff from '../models/Staff';
import Payroll from '../models/Payroll';
import InventoryItem from '../models/InventoryItem';
import InventoryTransaction from '../models/InventoryTransaction';
import HousekeepingTask from '../models/HousekeepingTask';
import MaintenanceRequest from '../models/MaintenanceRequest';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, period, page, limit } = req.query;

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (period) filter.period = period;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('generatedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      reports,
    });
  }
);

export const getReportById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const report = await Report.findById(req.params.id).populate(
      'generatedBy',
      'name role email'
    );

    if (!report) {
      return next(
        new AppError(
          `No report found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      report,
    });
  }
);

export const generateRevenueReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, period, year, month } = req.body;

    if (!startDate || !endDate) {
      return next(
        new AppError('Please provide start date and end date.', 400)
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end <= start) {
      return next(
        new AppError('End date must be after start date.', 400)
      );
    }

    const [
      bookingRevenue,
      invoiceRevenue,
      paymentBreakdown,
      dailyRevenue,
      roomTypeRevenue,
    ] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            status: 'checked_out',
            actualCheckOutTime: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalNights: { $sum: '$nights' },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: '$totalAmount' },
          },
        },
      ]),

      Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$items.category',
            totalRevenue: { $sum: '$total' },
            totalVAT: { $sum: '$vatAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: 'success',
            completedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$channel',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { total: -1 } },
      ]),

      Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$paidAt',
              },
            },
            revenue: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: 'checked_out',
            actualCheckOutTime: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'room',
            foreignField: '_id',
            as: 'roomInfo',
          },
        },
        { $unwind: '$roomInfo' },
        {
          $group: {
            _id: '$roomInfo.type',
            totalRevenue: { $sum: '$totalAmount' },
            totalNights: { $sum: '$nights' },
            bookingCount: { $sum: 1 },
            avgRate: { $avg: '$pricePerNight' },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
    ]);

    const totalRevenue = bookingRevenue[0]?.totalRevenue || 0;
    const totalNights = bookingRevenue[0]?.totalNights || 0;
    const totalBookings = bookingRevenue[0]?.totalBookings || 0;
    const avgBookingValue = bookingRevenue[0]?.avgBookingValue || 0;

    const totalRooms = await Room.countDocuments({ isActive: true });
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const availableRoomNights = totalRooms * totalDays;
    const occupancyRate =
      availableRoomNights > 0
        ? Math.round((totalNights / availableRoomNights) * 100 * 10) / 10
        : 0;

    const adr =
      totalNights > 0
        ? Math.round((totalRevenue / totalNights) * 100) / 100
        : 0;

    const revpar =
      availableRoomNights > 0
        ? Math.round((totalRevenue / availableRoomNights) * 100) / 100
        : 0;

    const reportData = {
      period: { startDate: start, endDate: end },
      revenue: {
        total: totalRevenue,
        formatted: formatETB(totalRevenue),
      },
      bookings: {
        total: totalBookings,
        totalNights,
        avgValue: avgBookingValue,
        formattedAvgValue: formatETB(avgBookingValue),
      },
      performance: {
        occupancyRate,
        adr,
        revpar,
        formattedADR: formatETB(adr),
        formattedRevPAR: formatETB(revpar),
      },
      paymentBreakdown,
      dailyRevenue,
      roomTypeRevenue,
      invoiceBreakdown: invoiceRevenue,
    };

    const report = await Report.create({
      title: `Revenue Report — ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      type: 'revenue',
      period: period || 'monthly',
      startDate: start,
      endDate: end,
      status: 'ready',
      reportData,
      summary: `Total revenue: ${formatETB(totalRevenue)} | ${totalBookings} bookings | ${totalNights} nights | Occupancy: ${occupancyRate}% | ADR: ${formatETB(adr)} | RevPAR: ${formatETB(revpar)}`,
      generatedBy: req.user?._id,
      totalRevenueETB: totalRevenue,
    });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'EXPORT',
        resource: 'Report',
        resourceId: report._id.toString(),
        description: `${req.user.name} generated revenue report for ${start.toDateString()} — ${end.toDateString()}. Total: ${formatETB(totalRevenue)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Revenue report generated successfully.',
      report,
    });
  }
);

export const generateOccupancyReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, period } = req.body;

    if (!startDate || !endDate) {
      return next(
        new AppError('Please provide start date and end date.', 400)
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const totalRooms = await Room.countDocuments({ isActive: true });
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const availableRoomNights = totalRooms * totalDays;

    const occupancyData = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['checked_in', 'checked_out'] },
          checkIn: { $lte: end },
          checkOut: { $gte: start },
        },
      },
      {
        $group: {
          _id: null,
          totalNights: { $sum: '$nights' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const roomTypeOccupancy = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['checked_in', 'checked_out'] },
          checkIn: { $lte: end },
          checkOut: { $gte: start },
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },
      { $unwind: '$roomInfo' },
      {
        $group: {
          _id: '$roomInfo.type',
          occupiedNights: { $sum: '$nights' },
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { occupiedNights: -1 } },
    ]);

    const totalNights = occupancyData[0]?.totalNights || 0;
    const totalBookings = occupancyData[0]?.totalBookings || 0;
    const totalRevenue = occupancyData[0]?.totalRevenue || 0;

    const occupancyRate =
      availableRoomNights > 0
        ? Math.round((totalNights / availableRoomNights) * 100 * 10) / 10
        : 0;

    const adr =
      totalNights > 0
        ? Math.round((totalRevenue / totalNights) * 100) / 100
        : 0;

    const revpar =
      availableRoomNights > 0
        ? Math.round((totalRevenue / availableRoomNights) * 100) / 100
        : 0;

    const reportData = {
      period: { startDate: start, endDate: end },
      totalRooms,
      totalDays,
      availableRoomNights,
      occupiedNights: totalNights,
      occupancyRate,
      adr,
      revpar,
      totalBookings,
      totalRevenue,
      formattedTotalRevenue: formatETB(totalRevenue),
      formattedADR: formatETB(adr),
      formattedRevPAR: formatETB(revpar),
      roomTypeOccupancy,
    };

    const report = await Report.create({
      title: `Occupancy Report — ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      type: 'occupancy',
      period: period || 'monthly',
      startDate: start,
      endDate: end,
      status: 'ready',
      reportData,
      summary: `Occupancy: ${occupancyRate}% | ${totalBookings} bookings | ${totalNights} nights | ADR: ${formatETB(adr)} | RevPAR: ${formatETB(revpar)}`,
      generatedBy: req.user?._id,
      totalRevenueETB: totalRevenue,
    });

    res.status(201).json({
      success: true,
      message: 'Occupancy report generated successfully.',
      report,
    });
  }
);

export const generateGuestReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, period } = req.body;

    if (!startDate || !endDate) {
      return next(
        new AppError('Please provide start date and end date.', 400)
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [
      totalGuests,
      newGuests,
      vipGuests,
      nationalityBreakdown,
      topGuests,
    ] = await Promise.all([
      Guest.countDocuments(),
      Guest.countDocuments({
        createdAt: { $gte: start, $lte: end },
      }),
      Guest.countDocuments({ vip: true }),
      Guest.aggregate([
        {
          $group: {
            _id: '$nationality',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Guest.find()
        .sort({ totalSpent: -1 })
        .limit(10)
        .select('fullName phone totalStays totalSpent loyaltyPoints vip'),
    ]);

    const reportData = {
      period: { startDate: start, endDate: end },
      totalGuests,
      newGuests,
      vipGuests,
      nationalityBreakdown,
      topGuests,
    };

    const report = await Report.create({
      title: `Guest Report — ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      type: 'guests',
      period: period || 'monthly',
      startDate: start,
      endDate: end,
      status: 'ready',
      reportData,
      summary: `Total guests: ${totalGuests} | New guests: ${newGuests} | VIP guests: ${vipGuests}`,
      generatedBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: 'Guest report generated successfully.',
      report,
    });
  }
);

export const generatePayrollReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { month, year } = req.body;

    if (!month || !year) {
      return next(
        new AppError('Please provide month and year.', 400)
      );
    }

    const payrollMonth = parseInt(month);
    const payrollYear = parseInt(year);

    const payrollData = await Payroll.aggregate([
      {
        $match: {
          month: payrollMonth,
          year: payrollYear,
        },
      },
      {
        $lookup: {
          from: 'staff',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffInfo',
        },
      },
      { $unwind: '$staffInfo' },
      {
        $group: {
          _id: '$staffInfo.department',
          count: { $sum: 1 },
          totalBaseSalary: { $sum: '$baseSalary' },
          totalBonuses: { $sum: '$bonuses' },
          totalDeductions: { $sum: '$deductions' },
          totalNetPay: { $sum: '$netPay' },
        },
      },
      { $sort: { totalNetPay: -1 } },
    ]);

    const totals = await Payroll.aggregate([
      {
        $match: {
          month: payrollMonth,
          year: payrollYear,
        },
      },
      {
        $group: {
          _id: null,
          totalStaff: { $sum: 1 },
          totalBaseSalary: { $sum: '$baseSalary' },
          totalBonuses: { $sum: '$bonuses' },
          totalDeductions: { $sum: '$deductions' },
          totalNetPay: { $sum: '$netPay' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
        },
      },
    ]);

    const summary = totals[0] || {
      totalStaff: 0,
      totalBaseSalary: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      paidCount: 0,
    };

    const reportData = {
      month: payrollMonth,
      year: payrollYear,
      summary: {
        ...summary,
        formattedTotalNetPay: formatETB(summary.totalNetPay),
        formattedTotalBaseSalary: formatETB(summary.totalBaseSalary),
        formattedTotalBonuses: formatETB(summary.totalBonuses),
        formattedTotalDeductions: formatETB(summary.totalDeductions),
      },
      departmentBreakdown: payrollData,
    };

    const startDate = new Date(payrollYear, payrollMonth - 1, 1);
    const endDate = new Date(payrollYear, payrollMonth, 0);

    const report = await Report.create({
      title: `Payroll Report — ${payrollMonth}/${payrollYear}`,
      type: 'staff_payroll',
      period: 'monthly',
      startDate,
      endDate,
      status: 'ready',
      reportData,
      summary: `Total staff: ${summary.totalStaff} | Total net pay: ${formatETB(summary.totalNetPay)} | Paid: ${summary.paidCount}/${summary.totalStaff}`,
      generatedBy: req.user?._id,
      totalRevenueETB: summary.totalNetPay,
    });

    res.status(201).json({
      success: true,
      message: 'Payroll report generated successfully.',
      report,
    });
  }
);

export const generateTaxReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate, period } = req.body;

    if (!startDate || !endDate) {
      return next(
        new AppError('Please provide start date and end date.', 400)
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const vatData = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalVAT: { $sum: '$vatAmount' },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    const monthlyVAT = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$paidAt' },
          },
          revenue: { $sum: '$total' },
          vat: { $sum: '$vatAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const taxSummary = vatData[0] || {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalVAT: 0,
      invoiceCount: 0,
    };

    const reportData = {
      period: { startDate: start, endDate: end },
      vatRate: 0.15,
      totalRevenue: taxSummary.totalRevenue,
      totalSubtotal: taxSummary.totalSubtotal,
      totalVAT: taxSummary.totalVAT,
      invoiceCount: taxSummary.invoiceCount,
      formattedTotalRevenue: formatETB(taxSummary.totalRevenue),
      formattedTotalSubtotal: formatETB(taxSummary.totalSubtotal),
      formattedTotalVAT: formatETB(taxSummary.totalVAT),
      monthlyBreakdown: monthlyVAT,
    };

    const report = await Report.create({
      title: `VAT Tax Report — ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      type: 'tax',
      period: period || 'monthly',
      startDate: start,
      endDate: end,
      status: 'ready',
      reportData,
      summary: `Total revenue: ${formatETB(taxSummary.totalRevenue)} | Total VAT (15%): ${formatETB(taxSummary.totalVAT)} | ${taxSummary.invoiceCount} invoices`,
      generatedBy: req.user?._id,
      totalRevenueETB: taxSummary.totalRevenue,
    });

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'EXPORT',
        resource: 'Report',
        resourceId: report._id.toString(),
        description: `${req.user.name} generated VAT tax report. Total VAT: ${formatETB(taxSummary.totalVAT)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'VAT tax report generated successfully.',
      report,
    });
  }
);

export const deleteReport = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return next(
        new AppError(
          `No report found with ID: ${req.params.id}`,
          404
        )
      );
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: `Report "${report.title}" deleted successfully.`,
    });
  }
);
