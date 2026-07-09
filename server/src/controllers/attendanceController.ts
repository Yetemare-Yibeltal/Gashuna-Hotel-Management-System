// server/src/controllers/attendanceController.ts
// ─────────────────────────────────────────────────────────────
// ATTENDANCE CONTROLLER — Gashuna Hotel Management System
//
// Handles daily staff attendance operations:
//   GET    /api/attendance                    → all records with filters
//   GET    /api/attendance/today              → today's attendance
//   GET    /api/attendance/staff/:staffId     → staff attendance history
//   GET    /api/attendance/monthly            → monthly summary report
//   POST   /api/attendance                    → create attendance record
//   PATCH  /api/attendance/:id/clockin        → clock in a staff member
//   PATCH  /api/attendance/:id/clockout       → clock out a staff member
//   PATCH  /api/attendance/:id/approve        → approve leave request
//   PUT    /api/attendance/:id                → update attendance record
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Attendance from '../models/Attendance';
import Staff from '../models/Staff';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all attendance records with filters
// @route   GET /api/attendance
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      staffId,
      status,
      startDate,
      endDate,
      department,
      page,
      limit,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (staffId) filter.staff = staffId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.date = dateFilter;
    }

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 30;
    const skip = (pageNum - 1) * limitNum;

    // ── If department filter provided find staff in that dept ──
    if (department) {
      const staffInDept = await Staff.find({
        department,
      }).select('_id');
      filter.staff = { $in: staffInDept.map((s) => s._id) };
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate(
          'staff',
          'fullName position department shift phone'
        )
        .populate('approvedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(filter),
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
// @desc    Get today's attendance records
// @route   GET /api/attendance/today
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getTodayAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    // Set date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: today, $lte: todayEnd },
    })
      .populate(
        'staff',
        'fullName position department shift photo'
      )
      .sort({ clockIn: 1 });

    // ── Get all active staff to find who has not clocked in ───
    const activeStaff = await Staff.find({
      status: 'active',
    }).select('_id fullName position department shift');

    const presentStaffIds = records
      .filter((r) => r.staff)
      .map((r) => {
        const staff = r.staff as { _id: { toString: () => string } };
        return staff._id.toString();
      });

    const absentStaff = activeStaff.filter(
      (s) => !presentStaffIds.includes(s._id.toString())
    );

    // ── Summary counts ────────────────────────────────────────
    const summary = {
      present: records.filter((r) => r.status === 'present').length,
      late: records.filter((r) => r.status === 'late').length,
      halfDay: records.filter((r) => r.status === 'half_day').length,
      onLeave: records.filter((r) => r.status === 'on_leave').length,
      absent: absentStaff.length,
      total: activeStaff.length,
    };

    res.status(200).json({
      success: true,
      date: today.toDateString(),
      summary,
      records,
      absentStaff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get attendance history for a specific staff member
// @route   GET /api/attendance/staff/:staffId
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getStaffAttendance = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { month, year } = req.query;

    const staff = await Staff.findById(req.params.staffId);
    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.staffId}`,
          404
        )
      );
    }

    // ── Build date filter ─────────────────────────────────────
    const filter: Record<string, unknown> = {
      staff: req.params.staffId,
    };

    if (month && year) {
      const startDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1
      );
      const endDate = new Date(
        parseInt(year as string),
        parseInt(month as string),
        0,
        23,
        59,
        59
      );
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter)
      .populate('approvedBy', 'name role')
      .sort({ date: -1 });

    // ── Calculate monthly summary ─────────────────────────────
    const summary = {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === 'present')
        .length,
      lateDays: records.filter((r) => r.status === 'late').length,
      halfDays: records.filter((r) => r.status === 'half_day')
        .length,
      leaveDays: records.filter((r) => r.status === 'on_leave')
        .length,
      absentDays: records.filter((r) => r.status === 'absent')
        .length,
      totalHoursWorked: records.reduce(
        (sum, r) => sum + r.hoursWorked,
        0
      ),
      avgHoursPerDay:
        records.length > 0
          ? records.reduce((sum, r) => sum + r.hoursWorked, 0) /
            records.filter((r) => r.hoursWorked > 0).length || 0
          : 0,
    };

    res.status(200).json({
      success: true,
      staff: {
        _id: staff._id,
        fullName: staff.fullName,
        position: staff.position,
        department: staff.department,
        shift: staff.shift,
      },
      summary,
      records,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get monthly attendance summary for all staff
// @route   GET /api/attendance/monthly
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getMonthlyAttendanceSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { month, year } = req.query;

    const currentMonth =
      parseInt(month as string) || new Date().getMonth() + 1;
    const currentYear =
      parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59
    );

    // ── Aggregate attendance by staff ─────────────────────────
    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$staff',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
            },
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
            },
          },
          halfDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0],
            },
          },
          leaveDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
            },
          },
          totalHoursWorked: { $sum: '$hoursWorked' },
        },
      },
      {
        $lookup: {
          from: 'staff',
          localField: '_id',
          foreignField: '_id',
          as: 'staffInfo',
        },
      },
      { $unwind: '$staffInfo' },
      {
        $project: {
          _id: 1,
          fullName: '$staffInfo.fullName',
          position: '$staffInfo.position',
          department: '$staffInfo.department',
          totalDays: 1,
          presentDays: 1,
          lateDays: 1,
          halfDays: 1,
          leaveDays: 1,
          absentDays: 1,
          totalHoursWorked: 1,
        },
      },
      { $sort: { department: 1, fullName: 1 } },
    ]);

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      count: summary.length,
      summary,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new attendance record
// @route   POST /api/attendance
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createAttendance = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { staffId, date, status, clockIn, clockOut, notes } =
      req.body;

    // ── Validate required fields ──────────────────────────────
    if (!staffId || !date || !status) {
      return next(
        new AppError(
          'Please provide staff ID, date, and status.',
          400
        )
      );
    }

    // ── Verify staff exists ───────────────────────────────────
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new AppError('Staff member not found.', 404));
    }

    // ── Check for duplicate record ────────────────────────────
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({
      staff: staffId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingRecord) {
      return next(
        new AppError(
          `An attendance record already exists for ${staff.fullName} on ${attendanceDate.toDateString()}.`,
          400
        )
      );
    }

    // ── Create attendance record ──────────────────────────────
    const attendance = await Attendance.create({
      staff: staffId,
      date: attendanceDate,
      status,
      clockIn: clockIn ? new Date(clockIn) : undefined,
      clockOut: clockOut ? new Date(clockOut) : undefined,
      notes: notes || undefined,
    });

    await attendance.populate(
      'staff',
      'fullName position department'
    );

    res.status(201).json({
      success: true,
      message: `Attendance record created for ${staff.fullName} on ${attendanceDate.toDateString()}.`,
      attendance,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Clock in a staff member
// @route   PATCH /api/attendance/:id/clockin
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const clockIn = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const attendance = await Attendance.findById(
      req.params.id
    ).populate('staff', 'fullName shift');

    if (!attendance) {
      return next(
        new AppError(
          `No attendance record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (attendance.clockIn) {
      return next(
        new AppError(
          'This staff member has already clocked in today.',
          400
        )
      );
    }

    const now = new Date();
    attendance.clockIn = now;
    attendance.status = 'present';

    // ── Check if late ─────────────────────────────────────────
    // Morning shift starts at 6:00 AM
    // Afternoon shift starts at 14:00
    // Night shift starts at 22:00
    const shiftStartTimes: Record<string, number> = {
      morning: 6,
      afternoon: 14,
      night: 22,
      rotating: 8,
    };

    const staff = attendance.staff as {
      fullName: string;
      shift: string;
    };

    const shiftStartHour = shiftStartTimes[staff.shift] || 8;
    const graceMinutes = 15; // 15 minute grace period

    const clockInHour = now.getHours();
    const clockInMinutes = now.getMinutes();
    const totalClockInMinutes = clockInHour * 60 + clockInMinutes;
    const shiftStartMinutes = shiftStartHour * 60 + graceMinutes;

    if (totalClockInMinutes > shiftStartMinutes) {
      attendance.status = 'late';
      attendance.isLate = true;
      attendance.lateByMinutes =
        totalClockInMinutes - shiftStartMinutes + graceMinutes;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `${staff.fullName} clocked in at ${now.toLocaleTimeString()}${attendance.isLate ? ` — ${attendance.lateByMinutes} minutes late` : ' — on time'}.`,
      attendance,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Clock out a staff member
// @route   PATCH /api/attendance/:id/clockout
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const clockOut = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const attendance = await Attendance.findById(
      req.params.id
    ).populate('staff', 'fullName');

    if (!attendance) {
      return next(
        new AppError(
          `No attendance record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (!attendance.clockIn) {
      return next(
        new AppError(
          'Cannot clock out — this staff member has not clocked in yet.',
          400
        )
      );
    }

    if (attendance.clockOut) {
      return next(
        new AppError(
          'This staff member has already clocked out today.',
          400
        )
      );
    }

    const now = new Date();
    attendance.clockOut = now;

    // Pre-save hook calculates hoursWorked and half_day status
    await attendance.save();

    const staff = attendance.staff as { fullName: string };

    res.status(200).json({
      success: true,
      message: `${staff.fullName} clocked out at ${now.toLocaleTimeString()}. Hours worked: ${attendance.hoursWorked.toFixed(1)}h.`,
      attendance,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Approve a leave request
// @route   PATCH /api/attendance/:id/approve
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const approveLeave = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const attendance = await Attendance.findById(
      req.params.id
    ).populate('staff', 'fullName');

    if (!attendance) {
      return next(
        new AppError(
          `No attendance record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (attendance.status !== 'on_leave') {
      return next(
        new AppError(
          'Can only approve records with on_leave status.',
          400
        )
      );
    }

    attendance.approvedBy = req.user?._id;
    await attendance.save();

    const staff = attendance.staff as { fullName: string };

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Attendance',
        resourceId: attendance._id.toString(),
        description: `${req.user.name} approved leave for ${staff.fullName} on ${attendance.date.toDateString()}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave approved for ${staff.fullName} on ${attendance.date.toDateString()}.`,
      attendance,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update an attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateAttendance = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return next(
        new AppError(
          `No attendance record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('staff', 'fullName position department');

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      attendance: updatedAttendance,
    });
  }
);
