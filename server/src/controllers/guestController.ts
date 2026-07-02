// server/src/controllers/guestController.ts
// ─────────────────────────────────────────────────────────────
// GUEST CONTROLLER — Gashuna Hotel Management System
//
// Handles all guest CRM operations:
//   GET    /api/guests                    → all guests with search
//   GET    /api/guests/:id                → single guest + history
//   POST   /api/guests                    → create new guest
//   PUT    /api/guests/:id                → update guest details
//   DELETE /api/guests/:id                → delete guest record
//   PATCH  /api/guests/:id/loyalty        → add loyalty points
//   PATCH  /api/guests/:id/vip            → toggle VIP status
//   GET    /api/guests/:id/bookings       → guest booking history
//   GET    /api/guests/stats              → guest statistics
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Guest from '../models/Guest';
import Booking from '../models/Booking';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all guests with optional search and filters
// @route   GET /api/guests
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getGuests = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      search,
      vip,
      nationality,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    // ── Build filter object ───────────────────────────────────
    const filter: Record<string, unknown> = {};

    // Full text search across name, phone, and email
    // Uses the text index defined on the Guest model
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (vip === 'true') filter.vip = true;
    if (nationality) filter.nationality = nationality;

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, number> = {
      [sortField]: sortOrder,
    };

    const [guests, total] = await Promise.all([
      Guest.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Guest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: guests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      guests,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single guest by ID with full booking history
// @route   GET /api/guests/:id
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getGuestById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    // Get full booking history for this guest
    const bookings = await Booking.find({ guest: req.params.id })
      .populate('room', 'name roomNumber type price')
      .sort({ createdAt: -1 });

    // Calculate total amount spent from completed bookings
    const totalSpentFromBookings = bookings
      .filter((b) => b.status === 'checked_out')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    res.status(200).json({
      success: true,
      guest,
      bookings,
      totalBookings: bookings.length,
      completedStays: bookings.filter((b) => b.status === 'checked_out')
        .length,
      totalSpentFromBookings,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get guest booking history only
// @route   GET /api/guests/:id/bookings
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getGuestBookings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    const bookings = await Booking.find({ guest: req.params.id })
      .populate('room', 'name roomNumber type floor price images')
      .sort({ checkIn: -1 });

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id,
        fullName: guest.fullName,
        phone: guest.phone,
        email: guest.email,
        vip: guest.vip,
        loyaltyPoints: guest.loyaltyPoints,
      },
      count: bookings.length,
      bookings,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get guest statistics
// @route   GET /api/guests/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getGuestStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalGuests = await Guest.countDocuments();
    const vipGuests = await Guest.countDocuments({ vip: true });

    // Nationality breakdown
    const nationalityStats = await Guest.aggregate([
      {
        $group: {
          _id: '$nationality',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // New guests this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newGuestsThisMonth = await Guest.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Top spending guests
    const topGuests = await Guest.find()
      .sort({ totalSpent: -1 })
      .limit(5)
      .select('fullName phone totalSpent totalStays vip');

    res.status(200).json({
      success: true,
      stats: {
        totalGuests,
        vipGuests,
        newGuestsThisMonth,
        nationalityBreakdown: nationalityStats,
        topSpendingGuests: topGuests,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new guest record
// @route   POST /api/guests
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const createGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      fullName,
      phone,
      email,
      nationality,
      idType,
      idNumber,
      address,
      dateOfBirth,
      gender,
      notes,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!fullName || !phone || !idNumber) {
      return next(
        new AppError(
          'Please provide guest full name, phone number, and ID number.',
          400
        )
      );
    }

    // ── Check if guest already exists by phone ────────────────
    const existingGuest = await Guest.findOne({ phone });
    if (existingGuest) {
      return next(
        new AppError(
          `A guest with phone number ${phone} already exists. Guest: ${existingGuest.fullName}`,
          400
        )
      );
    }

    // ── Create guest ──────────────────────────────────────────
    const guest = await Guest.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase(),
      nationality: nationality || 'Ethiopia',
      idType: idType || 'kebele_id',
      idNumber: idNumber.trim(),
      address,
      dateOfBirth,
      gender,
      notes,
      loyaltyPoints: 0,
      totalStays: 0,
      totalSpent: 0,
      vip: false,
    });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Guest',
        resourceId: guest._id.toString(),
        description: `${req.user.name} created new guest record: ${fullName} (${phone})`,
        newData: guest.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Guest record created for ${fullName}.`,
      guest,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update guest details
// @route   PUT /api/guests/:id
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const updateGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    const previousData = guest.toObject();

    // ── Check new phone is not already taken ──────────────────
    if (req.body.phone && req.body.phone !== guest.phone) {
      const duplicate = await Guest.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return next(
          new AppError(
            `Phone number ${req.body.phone} is already registered to another guest: ${duplicate.fullName}`,
            400
          )
        );
      }
    }

    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ── Audit log ─────────────────────────────────────────────
    if (req.user && updatedGuest) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Guest',
        resourceId: guest._id.toString(),
        description: `${req.user.name} updated guest record: ${guest.fullName}`,
        previousData,
        newData: updatedGuest.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Guest record for ${guest.fullName} updated successfully.`,
      guest: updatedGuest,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Add loyalty points to a guest
// @route   PATCH /api/guests/:id/loyalty
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const addLoyaltyPoints = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { points, reason } = req.body;

    if (!points || Number(points) <= 0) {
      return next(
        new AppError('Please provide a valid number of points to add.', 400)
      );
    }

    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    const previousPoints = guest.loyaltyPoints;
    guest.loyaltyPoints += Number(points);
    await guest.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Guest',
        resourceId: guest._id.toString(),
        description: `${req.user.name} added ${points} loyalty points to ${guest.fullName}. Reason: ${reason || 'Manual adjustment'}. Points: ${previousPoints} → ${guest.loyaltyPoints}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${points} loyalty points added to ${guest.fullName}.`,
      previousPoints,
      newPoints: guest.loyaltyPoints,
      guest,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Toggle VIP status for a guest
// @route   PATCH /api/guests/:id/vip
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const toggleVIPStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    const previousVIPStatus = guest.vip;
    guest.vip = !guest.vip;
    await guest.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Guest',
        resourceId: guest._id.toString(),
        description: `${req.user.name} ${guest.vip ? 'granted' : 'removed'} VIP status for guest: ${guest.fullName}`,
        previousData: { vip: previousVIPStatus },
        newData: { vip: guest.vip },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${guest.fullName} VIP status ${guest.vip ? 'granted' : 'removed'} successfully.`,
      vip: guest.vip,
      guest,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a guest record
// @route   DELETE /api/guests/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return next(
        new AppError(`No guest found with ID: ${req.params.id}`, 404)
      );
    }

    // ── Check for active bookings before deleting ─────────────
    const activeBookings = await Booking.countDocuments({
      guest: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
    });

    if (activeBookings > 0) {
      return next(
        new AppError(
          `Cannot delete guest ${guest.fullName} — they have ${activeBookings} active booking(s). Please resolve all bookings first.`,
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
        resource: 'Guest',
        resourceId: guest._id.toString(),
        description: `${req.user.name} deleted guest record: ${guest.fullName} (${guest.phone})`,
        previousData: guest.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await guest.deleteOne();

    res.status(200).json({
      success: true,
      message: `Guest record for ${guest.fullName} deleted successfully.`,
    });
  }
);
