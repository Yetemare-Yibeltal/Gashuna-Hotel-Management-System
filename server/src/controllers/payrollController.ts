// server/src/controllers/payrollController.ts
// ─────────────────────────────────────────────────────────────
// PAYROLL CONTROLLER — Gashuna Hotel Management System
//
// Handles monthly staff payroll operations:
//   GET    /api/payroll                     → all payroll records
//   GET    /api/payroll/stats               → payroll statistics
//   GET    /api/payroll/staff/:staffId      → staff payroll history
//   GET    /api/payroll/:id                 → single payroll record
//   POST   /api/payroll/generate            → generate monthly payroll
//   POST   /api/payroll                     → create single payroll
//   PUT    /api/payroll/:id                 → update payroll record
//   PATCH  /api/payroll/:id/approve         → approve payroll
//   PATCH  /api/payroll/:id/pay             → mark payroll as paid
//   DELETE /api/payroll/:id                 → delete draft payroll
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Payroll from '../models/Payroll';
import Staff from '../models/Staff';
import Attendance from '../models/Attendance';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

// ─────────────────────────────────────────────────────────────
// @desc    Get all payroll records with filters
// @route   GET /api/payroll
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getPayrollRecords = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      month,
      year,
      status,
      department,
      page,
      limit,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (month) filter.month = parseInt(month as string);
    if (year) filter.year = parseInt(year as string);
    if (status) filter.status = status;

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── If department filter find staff in that dept ──────────
    if (department) {
      const staffInDept = await Staff.find({
        department,
      }).select('_id');
      filter.staff = { $in: staffInDept.map((s) => s._id) };
    }

    const [records, total] = await Promise.all([
      Payroll.find(filter)
        .populate(
          'staff',
          'fullName position department bankAccountNumber bankName'
        )
        .populate('approvedBy', 'name role')
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payroll.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      records,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get payroll statistics
// @route   GET /api/payroll/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getPayrollStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { month, year } = req.query;

    const currentMonth =
      parseInt(month as string) || new Date().getMonth() + 1;
    const currentYear =
      parseInt(year as string) || new Date().getFullYear();

    // ── Monthly totals ────────────────────────────────────────
    const monthlyStats = await Payroll.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalNetPay: { $sum: '$netPay' },
          totalBaseSalary: { $sum: '$baseSalary' },
          totalBonuses: { $sum: '$bonuses' },
          totalDeductions: { $sum: '$deductions' },
        },
      },
    ]);

    // ── Department breakdown ──────────────────────────────────
    const departmentStats = await Payroll.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear,
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
          totalNetPay: { $sum: '$netPay' },
        },
      },
      { $sort: { totalNetPay: -1 } },
    ]);

    // ── Calculate overall totals ──────────────────────────────
    const overallTotal = monthlyStats.reduce(
      (acc, curr) => {
        acc.totalNetPay += curr.totalNetPay;
        acc.totalBaseSalary += curr.totalBaseSalary;
        acc.totalBonuses += curr.totalBonuses;
        acc.totalDeductions += curr.totalDeductions;
        acc.count += curr.count;
        return acc;
      },
      {
        totalNetPay: 0,
        totalBaseSalary: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        count: 0,
      }
    );

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      stats: {
        ...overallTotal,
        formattedTotalNetPay: formatETB(overallTotal.totalNetPay),
        formattedTotalBaseSalary: formatETB(
          overallTotal.totalBaseSalary
        ),
        formattedTotalBonuses: formatETB(overallTotal.totalBonuses),
        formattedTotalDeductions: formatETB(
          overallTotal.totalDeductions
        ),
        statusBreakdown: monthlyStats,
        departmentBreakdown: departmentStats,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get payroll history for a specific staff member
// @route   GET /api/payroll/staff/:staffId
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getStaffPayroll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const staff = await Staff.findById(req.params.staffId);

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.staffId}`,
          404
        )
      );
    }

    const records = await Payroll.find({
      staff: req.params.staffId,
    })
      .populate('approvedBy', 'name role')
      .sort({ year: -1, month: -1 });

    // ── Calculate totals ──────────────────────────────────────
    const totals = records.reduce(
      (acc, record) => {
        acc.totalEarned += record.netPay;
        acc.totalBonuses += record.bonuses;
        acc.totalDeductions += record.deductions;
        return acc;
      },
      { totalEarned: 0, totalBonuses: 0, totalDeductions: 0 }
    );

    res.status(200).json({
      success: true,
      staff: {
        _id: staff._id,
        fullName: staff.fullName,
        position: staff.position,
        department: staff.department,
        salary: staff.salary,
        formattedSalary: formatETB(staff.salary),
      },
      count: records.length,
      totals: {
        ...totals,
        formattedTotalEarned: formatETB(totals.totalEarned),
      },
      records,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single payroll record by ID
// @route   GET /api/payroll/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getPayrollById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const payroll = await Payroll.findById(req.params.id)
      .populate(
        'staff',
        'fullName position department phone email bankAccountNumber bankName'
      )
      .populate('approvedBy', 'name role email');

    if (!payroll) {
      return next(
        new AppError(
          `No payroll record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      payroll,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Generate monthly payroll for all active staff
// @route   POST /api/payroll/generate
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const generateMonthlyPayroll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { month, year } = req.body;

    if (!month || !year) {
      return next(
        new AppError(
          'Please provide month and year for payroll generation.',
          400
        )
      );
    }

    const payrollMonth = parseInt(month);
    const payrollYear = parseInt(year);

    if (payrollMonth < 1 || payrollMonth > 12) {
      return next(
        new AppError('Month must be between 1 and 12.', 400)
      );
    }

    // ── Check if payroll already generated for this month ─────
    const existingPayroll = await Payroll.countDocuments({
      month: payrollMonth,
      year: payrollYear,
    });

    if (existingPayroll > 0) {
      return next(
        new AppError(
          `Payroll for ${payrollMonth}/${payrollYear} has already been generated (${existingPayroll} records found). Delete existing records first if you want to regenerate.`,
          400
        )
      );
    }

    // ── Get all active staff ──────────────────────────────────
    const activeStaff = await Staff.find({ status: 'active' });

    if (activeStaff.length === 0) {
      return next(
        new AppError('No active staff members found.', 404)
      );
    }

    // ── Get attendance for the month ──────────────────────────
    const startDate = new Date(payrollYear, payrollMonth - 1, 1);
    const endDate = new Date(
      payrollYear,
      payrollMonth,
      0,
      23,
      59,
      59
    );

    // ── Generate payroll for each staff member ────────────────
    const payrollRecords = [];
    const errors = [];

    for (const staff of activeStaff) {
      try {
        // Get attendance summary for this staff member
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

        // ── Calculate deductions for absences ─────────────────
        // Daily rate = monthly salary / 26 working days
        const dailyRate = staff.salary / 26;
        const absenceDeduction =
          Math.round(daysAbsent * dailyRate * 100) / 100;
        const halfDayDeduction =
          Math.round(halfDays * (dailyRate / 2) * 100) / 100;
        const totalDeductions = absenceDeduction + halfDayDeduction;

        // Create payroll record
        // Pre-save hook calculates netPay automatically
        const payroll = await Payroll.create({
          staff: staff._id,
          month: payrollMonth,
          year: payrollYear,
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
          staffId: staff._id,
          staffName: staff.fullName,
          error:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // ── Calculate month total ─────────────────────────────────
    const totalNetPay = payrollRecords.reduce(
      (sum, p) => sum + p.netPay,
      0
    );

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Payroll',
        resourceId: `${payrollMonth}-${payrollYear}`,
        description: `${req.user.name} generated payroll for ${payrollMonth}/${payrollYear}. ${payrollRecords.length} records created. Total: ${formatETB(totalNetPay)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Payroll generated for ${payrollMonth}/${payrollYear}. ${payrollRecords.length} records created.${errors.length > 0 ? ` ${errors.length} error(s) occurred.` : ''}`,
      month: payrollMonth,
      year: payrollYear,
      recordsCreated: payrollRecords.length,
      totalNetPay,
      formattedTotalNetPay: formatETB(totalNetPay),
      errors: errors.length > 0 ? errors : undefined,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a single payroll record manually
// @route   POST /api/payroll
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createPayroll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      staffId,
      month,
      year,
      bonuses,
      bonusReason,
      deductions,
      deductionReason,
      advancesPaid,
      daysWorked,
      daysAbsent,
    } = req.body;

    if (!staffId || !month || !year) {
      return next(
        new AppError(
          'Please provide staff ID, month, and year.',
          400
        )
      );
    }

    // ── Verify staff exists ───────────────────────────────────
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new AppError('Staff member not found.', 404));
    }

    // ── Check for duplicate ───────────────────────────────────
    const existing = await Payroll.findOne({
      staff: staffId,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existing) {
      return next(
        new AppError(
          `Payroll already exists for ${staff.fullName} for ${month}/${year}.`,
          400
        )
      );
    }

    const payroll = await Payroll.create({
      staff: staffId,
      month: parseInt(month),
      year: parseInt(year),
      baseSalary: staff.salary,
      bonuses: bonuses || 0,
      bonusReason: bonusReason || undefined,
      deductions: deductions || 0,
      deductionReason: deductionReason || undefined,
      advancesPaid: advancesPaid || 0,
      netPay: 0,
      daysWorked: daysWorked || 0,
      daysAbsent: daysAbsent || 0,
      status: 'draft',
    });

    await payroll.populate(
      'staff',
      'fullName position department salary'
    );

    res.status(201).json({
      success: true,
      message: `Payroll record created for ${staff.fullName} — ${month}/${year}. Net Pay: ${formatETB(payroll.netPay)}`,
      payroll,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update a payroll record (add bonus, deduction, etc.)
// @route   PUT /api/payroll/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updatePayroll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return next(
        new AppError(
          `No payroll record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (payroll.status === 'paid') {
      return next(
        new AppError(
          'Cannot modify a payroll record that has already been paid.',
          400
        )
      );
    }

    const previousNetPay = payroll.netPay;

    const updatedPayroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('staff', 'fullName position department');

    res.status(200).json({
      success: true,
      message: `Payroll updated. Net pay changed from ${formatETB(previousNetPay)} to ${formatETB(updatedPayroll?.netPay || 0)}.`,
      payroll: updatedPayroll,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Approve a payroll record
// @route   PATCH /api/payroll/:id/approve
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const approvePayroll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const payroll = await Payroll.findById(req.params.id).populate(
      'staff',
      'fullName position'
    );

    if (!payroll) {
      return next(
        new AppError(
          `No payroll record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (payroll.status !== 'draft') {
      return next(
        new AppError(
          `Payroll cannot be approved — current status is '${payroll.status}'.`,
          400
        )
      );
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user?._id;
    await payroll.save();

    const staff = payroll.staff as {
      fullName: string;
      position: string;
    };

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Payroll',
        resourceId: payroll._id.toString(),
        description: `${req.user.name} approved payroll for ${staff.fullName} — ${payroll.month}/${payroll.year}. Net pay: ${formatETB(payroll.netPay)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payroll approved for ${staff.fullName}. Net Pay: ${formatETB(payroll.netPay)}`,
      payroll,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Mark payroll as paid
// @route   PATCH /api/payroll/:id/pay
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const markPayrollPaid = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentMethod } = req.body;

    const validMethods = [
      'cash',
      'bank_transfer',
      'telebirr',
      'chapa',
    ];

    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return next(
        new AppError(
          `Please provide a valid payment method: ${validMethods.join(', ')}.`,
          400
        )
      );
    }

    const payroll = await Payroll.findById(req.params.id).populate(
      'staff',
      'fullName position department'
    );

    if (!payroll) {
      return next(
        new AppError(
          `No payroll record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (payroll.status !== 'approved') {
      return next(
        new AppError(
          `Payroll must be approved before marking as paid. Current status: '${payroll.status}'.`,
          400
        )
      );
    }

    payroll.status = 'paid';
    payroll.paymentMethod = paymentMethod;
    payroll.paidAt = new Date();
    await payroll.save();

    const staff = payroll.staff as {
      fullName: string;
      position: string;
    };

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Payroll',
        resourceId: payroll._id.toString(),
        description: `${req.user.name} marked payroll as paid for ${staff.fullName} — ${payroll.month}/${payroll.year}. Amount: ${formatETB(payroll.netPay)} via ${paymentMethod}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payroll marked as paid for ${staff.fullName}. Amount: ${formatETB(payroll.netPay)} via ${paymentMethod}.`,
      payroll,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a draft payroll record
// @route   DELETE /api/payroll/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deletePayroll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const payroll = await Payroll.findById(req.params.id).populate(
      'staff',
      'fullName'
    );

    if (!payroll) {
      return next(
        new AppError(
          `No payroll record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (payroll.status !== 'draft') {
      return next(
        new AppError(
          `Only draft payroll records can be deleted. Current status: '${payroll.status}'.`,
          400
        )
      );
    }

    const staff = payroll.staff as { fullName: string };

    await payroll.deleteOne();

    res.status(200).json({
      success: true,
      message: `Draft payroll record for ${staff.fullName} deleted successfully.`,
    });
  }
);
