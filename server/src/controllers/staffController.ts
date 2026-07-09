// server/src/controllers/staffController.ts
// ─────────────────────────────────────────────────────────────
// STAFF CONTROLLER — Gashuna Hotel Management System
//
// Handles all HR and staff management operations:
//   GET    /api/staff                  → all staff with filters
//   GET    /api/staff/stats            → staff statistics
//   GET    /api/staff/:id              → single staff profile
//   POST   /api/staff                  → create new staff record
//   PUT    /api/staff/:id              → update staff details
//   PATCH  /api/staff/:id/status       → change staff status
//   PATCH  /api/staff/:id/salary       → update salary in ETB
//   DELETE /api/staff/:id              → delete staff record
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Staff from '../models/Staff';
import Attendance from '../models/Attendance';
import Payroll from '../models/Payroll';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

// ─────────────────────────────────────────────────────────────
// @desc    Get all staff with optional filters
// @route   GET /api/staff
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getAllStaff = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      department,
      shift,
      status,
      search,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (department) filter.department = department;
    if (shift) filter.shift = shift;
    if (status) filter.status = status;
    else filter.status = { $ne: 'terminated' };

    // Search by name, phone, or position
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'fullName';
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, number> = {
      [sortField]: sortOrder,
    };

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .populate('linkedUserAccount', 'name email role')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Staff.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: staff.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      staff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get staff statistics for HR dashboard
// @route   GET /api/staff/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getStaffStats = asyncHandler(
  async (req: Request, res: Response) => {
    // ── Overall counts ────────────────────────────────────────
    const [
      totalStaff,
      activeStaff,
      onLeaveStaff,
      terminatedStaff,
    ] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'active' }),
      Staff.countDocuments({ status: 'on_leave' }),
      Staff.countDocuments({ status: 'terminated' }),
    ]);

    // ── Staff by department ───────────────────────────────────
    const departmentStats = await Staff.aggregate([
      { $match: { status: { $ne: 'terminated' } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalSalary: { $sum: '$salary' },
          avgSalary: { $avg: '$salary' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── Staff by shift ────────────────────────────────────────
    const shiftStats = await Staff.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$shift',
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Total monthly payroll ─────────────────────────────────
    const payrollSummary = await Staff.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalMonthlyPayroll: { $sum: '$salary' },
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
        },
      },
    ]);

    const payroll = payrollSummary[0] || {
      totalMonthlyPayroll: 0,
      avgSalary: 0,
      minSalary: 0,
      maxSalary: 0,
    };

    // ── New hires this month ──────────────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newHiresThisMonth = await Staff.countDocuments({
      hireDate: { $gte: startOfMonth },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalStaff,
        activeStaff,
        onLeaveStaff,
        terminatedStaff,
        newHiresThisMonth,
        totalMonthlyPayroll: payroll.totalMonthlyPayroll,
        avgSalary: payroll.avgSalary,
        minSalary: payroll.minSalary,
        maxSalary: payroll.maxSalary,
        formattedTotalPayroll: formatETB(
          payroll.totalMonthlyPayroll
        ),
        formattedAvgSalary: formatETB(payroll.avgSalary),
        departmentBreakdown: departmentStats,
        shiftBreakdown: shiftStats,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single staff member by ID
// @route   GET /api/staff/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getStaffById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const staff = await Staff.findById(req.params.id).populate(
      'linkedUserAccount',
      'name email role lastLogin'
    );

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Get recent attendance records ─────────────────────────
    const recentAttendance = await Attendance.find({
      staff: req.params.id,
    })
      .sort({ date: -1 })
      .limit(30);

    // ── Get payroll history ───────────────────────────────────
    const payrollHistory = await Payroll.find({
      staff: req.params.id,
    })
      .sort({ year: -1, month: -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      staff,
      recentAttendance,
      payrollHistory,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const createStaff = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      fullName,
      position,
      department,
      phone,
      email,
      salary,
      hireDate,
      shift,
      address,
      emergencyContactName,
      emergencyContactPhone,
      bankAccountNumber,
      bankName,
      linkedUserAccount,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (
      !fullName ||
      !position ||
      !department ||
      !phone ||
      !salary ||
      !hireDate
    ) {
      return next(
        new AppError(
          'Please provide full name, position, department, phone, salary, and hire date.',
          400
        )
      );
    }

    // ── Validate department ───────────────────────────────────
    const validDepartments = [
      'front_desk',
      'housekeeping',
      'restaurant',
      'kitchen',
      'maintenance',
      'security',
      'management',
      'accounting',
    ];

    if (!validDepartments.includes(department)) {
      return next(
        new AppError(
          `Invalid department. Valid values: ${validDepartments.join(', ')}.`,
          400
        )
      );
    }

    // ── Check phone is unique ─────────────────────────────────
    const existingStaff = await Staff.findOne({ phone });
    if (existingStaff) {
      return next(
        new AppError(
          `A staff member with phone ${phone} already exists: ${existingStaff.fullName}`,
          400
        )
      );
    }

    // ── Validate salary ───────────────────────────────────────
    if (Number(salary) < 0) {
      return next(
        new AppError('Salary cannot be negative.', 400)
      );
    }

    // ── Create staff record ───────────────────────────────────
    const staff = await Staff.create({
      fullName: fullName.trim(),
      position: position.trim(),
      department,
      phone: phone.trim(),
      email: email?.trim().toLowerCase(),
      salary: Number(salary),
      hireDate: new Date(hireDate),
      shift: shift || 'morning',
      status: 'active',
      address: address?.trim(),
      emergencyContactName: emergencyContactName?.trim(),
      emergencyContactPhone: emergencyContactPhone?.trim(),
      bankAccountNumber: bankAccountNumber?.trim(),
      bankName: bankName?.trim(),
      linkedUserAccount: linkedUserAccount || undefined,
    });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Staff',
        resourceId: staff._id.toString(),
        description: `${req.user.name} created new staff record: ${fullName} — ${position} (${department}). Salary: ${formatETB(Number(salary))}`,
        newData: staff.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Staff record created for ${fullName} — ${position}.`,
      staff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update staff details
// @route   PUT /api/staff/:id
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateStaff = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousData = staff.toObject();

    // ── Check phone uniqueness if changing ────────────────────
    if (req.body.phone && req.body.phone !== staff.phone) {
      const duplicate = await Staff.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return next(
          new AppError(
            `Phone number ${req.body.phone} is already registered to ${duplicate.fullName}.`,
            400
          )
        );
      }
    }

    // ── Validate salary if provided ───────────────────────────
    if (req.body.salary !== undefined && Number(req.body.salary) < 0) {
      return next(
        new AppError('Salary cannot be negative.', 400)
      );
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ── Audit log ─────────────────────────────────────────────
    if (req.user && updatedStaff) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Staff',
        resourceId: staff._id.toString(),
        description: `${req.user.name} updated staff record: ${staff.fullName}`,
        previousData,
        newData: updatedStaff.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Staff record for ${staff.fullName} updated successfully.`,
      staff: updatedStaff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update staff status
// @route   PATCH /api/staff/:id/status
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const updateStaffStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status, terminationDate } = req.body;

    const validStatuses = ['active', 'on_leave', 'terminated'];

    if (!status || !validStatuses.includes(status)) {
      return next(
        new AppError(
          `Invalid status. Valid values: ${validStatuses.join(', ')}.`,
          400
        )
      );
    }

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousStatus = staff.status;
    staff.status = status;

    if (status === 'terminated' && terminationDate) {
      staff.terminationDate = new Date(terminationDate);
    }

    await staff.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Staff',
        resourceId: staff._id.toString(),
        description: `${req.user.name} changed ${staff.fullName} status from '${previousStatus}' to '${status}'`,
        previousData: { status: previousStatus },
        newData: { status },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${staff.fullName} status updated to '${status}'.`,
      staff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update staff salary
// @route   PATCH /api/staff/:id/salary
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const updateStaffSalary = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { salary, reason } = req.body;

    if (!salary || Number(salary) < 0) {
      return next(
        new AppError('Please provide a valid salary amount.', 400)
      );
    }

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const previousSalary = staff.salary;
    staff.salary = Number(salary);
    await staff.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Staff',
        resourceId: staff._id.toString(),
        description: `${req.user.name} updated ${staff.fullName} salary from ${formatETB(previousSalary)} to ${formatETB(Number(salary))}. Reason: ${reason || 'Not specified'}`,
        previousData: { salary: previousSalary },
        newData: { salary: Number(salary) },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${staff.fullName} salary updated from ${formatETB(previousSalary)} to ${formatETB(Number(salary))}.`,
      staff,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a staff record
// @route   DELETE /api/staff/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteStaff = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return next(
        new AppError(
          `No staff member found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Recommend termination over deletion ───────────────────
    if (staff.status === 'active') {
      return next(
        new AppError(
          `Cannot delete an active staff member. Please set their status to 'terminated' first.`,
          400
        )
      );
    }

    // ── Audit log before deletion ─────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'Staff',
        resourceId: staff._id.toString(),
        description: `${req.user.name} deleted staff record: ${staff.fullName} — ${staff.position} (${staff.department})`,
        previousData: staff.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await staff.deleteOne();

    res.status(200).json({
      success: true,
      message: `Staff record for ${staff.fullName} deleted successfully.`,
    });
  }
);
