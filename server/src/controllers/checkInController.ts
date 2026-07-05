// server/src/controllers/checkInController.ts
// ─────────────────────────────────────────────────────────────
// CHECK-IN CONTROLLER — Gashuna Hotel Management System
//
// Handles the formal guest arrival and departure process:
//   GET    /api/checkins                → all check-in records
//   GET    /api/checkins/active         → currently checked-in guests
//   GET    /api/checkins/:id            → single check-in record
//   POST   /api/checkins                → check in a guest
//   PATCH  /api/checkins/:id/checkout   → check out a guest
//   PATCH  /api/checkins/:id/deposit    → update deposit details
//   GET    /api/checkins/booking/:bookingId → get by booking
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import CheckIn from '../models/CheckIn';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Guest from '../models/Guest';
import HousekeepingTask, {
  DEFAULT_CHECKOUT_CHECKLIST,
} from '../models/HousekeepingTask';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all check-in records with filters
// @route   GET /api/checkins
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getCheckIns = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, roomId, guestId, page, limit } = req.query;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (roomId) filter.room = roomId;
    if (guestId) filter.guest = guestId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [checkIns, total] = await Promise.all([
      CheckIn.find(filter)
        .populate('guest', 'fullName phone email vip')
        .populate('room', 'name roomNumber type floor')
        .populate('booking', 'bookingRef checkIn checkOut totalAmount')
        .populate('checkedInBy', 'name role')
        .populate('checkedOutBy', 'name role')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limitNum),
      CheckIn.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      checkIns,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get all currently checked-in guests
// @route   GET /api/checkins/active
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getActiveCheckIns = asyncHandler(
  async (req: Request, res: Response) => {
    const activeCheckIns = await CheckIn.find({ status: 'checked_in' })
      .populate('guest', 'fullName phone email vip loyaltyPoints')
      .populate('room', 'name roomNumber type floor price')
      .populate('booking', 'bookingRef checkIn checkOut totalAmount nights')
      .populate('checkedInBy', 'name role')
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: activeCheckIns.length,
      checkIns: activeCheckIns,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single check-in record by ID
// @route   GET /api/checkins/:id
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getCheckInById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('guest')
      .populate('room')
      .populate('booking')
      .populate('checkedInBy', 'name role')
      .populate('checkedOutBy', 'name role');

    if (!checkIn) {
      return next(
        new AppError(
          `No check-in record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      checkIn,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get check-in record by booking ID
// @route   GET /api/checkins/booking/:bookingId
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getCheckInByBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const checkIn = await CheckIn.findOne({
      booking: req.params.bookingId,
    })
      .populate('guest')
      .populate('room')
      .populate('booking')
      .populate('checkedInBy', 'name role')
      .populate('checkedOutBy', 'name role');

    if (!checkIn) {
      return next(
        new AppError(
          `No check-in record found for booking: ${req.params.bookingId}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      checkIn,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Check in a guest
// @route   POST /api/checkins
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const checkInGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      bookingId,
      roomKeyNumber,
      securityDeposit,
      depositPaymentMethod,
      idVerified,
      idType,
      idNumber,
      vehicleNumber,
      numberOfGuests,
      arrivalNotes,
    } = req.body;

    // ── Validate booking ID ───────────────────────────────────
    if (!bookingId) {
      return next(
        new AppError('Booking ID is required for check-in.', 400)
      );
    }

    // ── Find the booking ──────────────────────────────────────
    const booking = await Booking.findById(bookingId)
      .populate('guest', 'fullName phone email vip')
      .populate('room', 'name roomNumber type');

    if (!booking) {
      return next(new AppError('Booking not found.', 404));
    }

    // ── Verify booking is confirmed ───────────────────────────
    if (booking.status !== 'confirmed') {
      return next(
        new AppError(
          `Cannot check in — booking status is '${booking.status}'. Booking must be confirmed first.`,
          400
        )
      );
    }

    // ── Check no existing active check-in for this booking ────
    const existingCheckIn = await CheckIn.findOne({
      booking: bookingId,
    });

    if (existingCheckIn) {
      return next(
        new AppError(
          'A check-in record already exists for this booking.',
          400
        )
      );
    }

    // ── Create check-in record ────────────────────────────────
    const checkIn = await CheckIn.create({
      booking: bookingId,
      guest: booking.guest,
      room: booking.room,
      status: 'checked_in',
      checkInTime: new Date(),
      checkedInBy: req.user?._id,
      roomKeyNumber: roomKeyNumber || '',
      securityDeposit: securityDeposit || 0,
      depositCurrency: 'ETB',
      depositPaymentMethod: depositPaymentMethod || undefined,
      idVerified: idVerified || false,
      idType: idType || undefined,
      idNumber: idNumber || undefined,
      vehicleNumber: vehicleNumber || undefined,
      numberOfGuests: numberOfGuests || booking.adults,
      arrivalNotes: arrivalNotes || undefined,
      expectedCheckOutDate: booking.checkOut,
      depositRefunded: 0,
      depositDeduction: 0,
    });

    // ── Update booking status to checked_in ───────────────────
    booking.status = 'checked_in';
    booking.actualCheckInTime = new Date();
    booking.checkedInBy = req.user?._id;
    await booking.save();

    // ── Update room status to occupied ────────────────────────
    await Room.findByIdAndUpdate(booking.room, {
      status: 'occupied',
    });

    // ── Populate the check-in record ──────────────────────────
    await checkIn.populate('guest', 'fullName phone email vip');
    await checkIn.populate('room', 'name roomNumber type floor');
    await checkIn.populate('booking', 'bookingRef checkIn checkOut');
    await checkIn.populate('checkedInBy', 'name role');

    const guest = booking.guest as {
      _id: string;
      fullName: string;
      vip: boolean;
    };

    const room = booking.room as {
      _id: string;
      name: string;
      roomNumber: string;
    };

    // ── Create notification for manager ───────────────────────
    const { default: User } = await import('../models/User');
    const managerUser = await User.findOne({
      role: { $in: ['admin', 'manager'] },
    });

    if (managerUser) {
      await Notification.createNotification({
        recipient: managerUser._id,
        type: 'success',
        event: 'CHECKIN_COMPLETED',
        title: `Check-in — ${booking.bookingRef}`,
        message: `${guest.fullName} has checked in to Room ${room.roomNumber} — ${room.name}. ${guest.vip ? '⭐ VIP Guest' : ''}`,
        link: `/admin/reservations/${booking._id}`,
        relatedBooking: booking._id,
        relatedGuest: guest._id,
        relatedRoom: room._id,
      });
    }

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CHECKIN',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} checked in ${guest.fullName} to Room ${room.roomNumber} for booking ${booking.bookingRef}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `${guest.fullName} checked in successfully to Room ${room.roomNumber}.${guest.vip ? ' ⭐ VIP guest — please provide premium service.' : ''}`,
      checkIn,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Check out a guest
// @route   PATCH /api/checkins/:id/checkout
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const checkOutGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      depositRefunded,
      depositDeduction,
      depositDeductionReason,
      roomConditionNotes,
      checkoutNotes,
    } = req.body;

    const checkIn = await CheckIn.findById(req.params.id)
      .populate('guest', 'fullName phone email')
      .populate('room', 'name roomNumber type')
      .populate('booking', 'bookingRef totalAmount');

    if (!checkIn) {
      return next(
        new AppError(
          `No check-in record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (checkIn.status !== 'checked_in') {
      return next(
        new AppError(
          `Cannot check out — status is already '${checkIn.status}'.`,
          400
        )
      );
    }

    // ── Update check-in record ────────────────────────────────
    checkIn.status = 'checked_out';
    checkIn.checkOutTime = new Date();
    checkIn.checkedOutBy = req.user?._id;
    checkIn.depositRefunded = depositRefunded || 0;
    checkIn.depositDeduction = depositDeduction || 0;
    checkIn.depositDeductionReason = depositDeductionReason || '';
    checkIn.roomConditionNotes = roomConditionNotes || '';
    checkIn.checkoutNotes = checkoutNotes || '';
    await checkIn.save();

    // ── Update booking status ─────────────────────────────────
    await Booking.findByIdAndUpdate(checkIn.booking, {
      status: 'checked_out',
      actualCheckOutTime: new Date(),
      checkedOutBy: req.user?._id,
    });

    // ── Update room status to cleaning ────────────────────────
    await Room.findByIdAndUpdate(checkIn.room, {
      status: 'cleaning',
    });

    // ── Update guest stats ────────────────────────────────────
    const booking = await Booking.findById(checkIn.booking);
    if (booking) {
      const pointsEarned = Math.floor(booking.totalAmount / 100);
      await Guest.findByIdAndUpdate(checkIn.guest, {
        $inc: {
          loyaltyPoints: pointsEarned,
          totalStays: 1,
          totalSpent: booking.totalAmount,
        },
      });
    }

    // ── Create housekeeping task ──────────────────────────────
    await HousekeepingTask.create({
      room: checkIn.room,
      booking: checkIn.booking,
      taskType: 'checkout_clean',
      priority: 'normal',
      status: 'pending',
      checklist: DEFAULT_CHECKOUT_CHECKLIST,
      estimatedDuration: 45,
    });

    const guest = checkIn.guest as {
      fullName: string;
    };

    const room = checkIn.room as {
      name: string;
      roomNumber: string;
    };

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CHECKOUT',
        resource: 'Booking',
        resourceId: checkIn.booking.toString(),
        description: `${req.user.name} checked out ${guest.fullName} from Room ${room.roomNumber}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `${guest.fullName} checked out successfully from Room ${room.roomNumber}. Room is now being cleaned.`,
      checkIn,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update deposit details
// @route   PATCH /api/checkins/:id/deposit
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const updateDeposit = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { securityDeposit, depositPaymentMethod } = req.body;

    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return next(
        new AppError(
          `No check-in record found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (checkIn.status !== 'checked_in') {
      return next(
        new AppError(
          'Can only update deposit for currently checked-in guests.',
          400
        )
      );
    }

    if (securityDeposit !== undefined) {
      checkIn.securityDeposit = Number(securityDeposit);
    }

    if (depositPaymentMethod) {
      checkIn.depositPaymentMethod = depositPaymentMethod;
    }

    await checkIn.save();

    res.status(200).json({
      success: true,
      message: 'Deposit details updated successfully.',
      checkIn,
    });
  }
);
