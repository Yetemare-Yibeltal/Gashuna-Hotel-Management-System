// server/src/controllers/bookingController.ts
// ─────────────────────────────────────────────────────────────
// BOOKING CONTROLLER — Gashuna Hotel Management System
//
// Handles the complete booking lifecycle:
//   GET    /api/bookings                → all bookings with filters
//   GET    /api/bookings/stats          → booking statistics
//   GET    /api/bookings/:id            → single booking detail
//   POST   /api/bookings                → create new booking
//   PUT    /api/bookings/:id            → update booking details
//   PATCH  /api/bookings/:id/confirm    → confirm a booking
//   PATCH  /api/bookings/:id/cancel     → cancel a booking
//   PATCH  /api/bookings/:id/checkin    → check guest in
//   PATCH  /api/bookings/:id/checkout   → check guest out
//   PATCH  /api/bookings/:id/payment    → update payment status
//   DELETE /api/bookings/:id            → delete pending booking
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Booking from '../models/Booking';
import Room from '../models/Room';
import Guest from '../models/Guest';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import generateBookingRef from '../utils/generateBookingRef';
import { buildPriceSummary, VAT_RATE } from '../utils/formatCurrency';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all bookings with filters
// @route   GET /api/bookings
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      paymentStatus,
      roomId,
      guestId,
      source,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      order,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (roomId) filter.room = roomId;
    if (guestId) filter.guest = guestId;
    if (source) filter.source = source;

    // Date range filter on checkIn date
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.checkIn = dateFilter;
    }

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, number> = { [sortField]: sortOrder };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('guest', 'fullName phone email vip loyaltyPoints')
        .populate('room', 'name roomNumber type floor price images')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      bookings,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get booking statistics for admin dashboard
// @route   GET /api/bookings/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getBookingStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { year, month } = req.query;

    const currentYear = parseInt(year as string) || new Date().getFullYear();
    const currentMonth = parseInt(month as string) || new Date().getMonth() + 1;

    // Start and end of the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // ── Booking counts by status ──────────────────────────────
    const statusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    // ── Monthly booking counts ────────────────────────────────
    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalNights: { $sum: '$nights' },
          avgStayLength: { $avg: '$nights' },
        },
      },
    ]);

    // ── Bookings by source ────────────────────────────────────
    const sourceStats = await Booking.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Today's check-ins and check-outs ──────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayCheckIns, todayCheckOuts, pendingBookings] =
      await Promise.all([
        Booking.countDocuments({
          checkIn: { $gte: today, $lte: todayEnd },
          status: 'confirmed',
        }),
        Booking.countDocuments({
          checkOut: { $gte: today, $lte: todayEnd },
          status: 'checked_in',
        }),
        Booking.countDocuments({ status: 'pending' }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        todayCheckIns,
        todayCheckOuts,
        pendingBookings,
        statusBreakdown: statusStats,
        monthly: monthlyStats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          totalNights: 0,
          avgStayLength: 0,
        },
        sourceBreakdown: sourceStats,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getBookingById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id)
      .populate('guest')
      .populate('room')
      .populate('checkedInBy', 'name email role')
      .populate('checkedOutBy', 'name email role');

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      booking,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public (website) + Private (admin walk-in)
// ─────────────────────────────────────────────────────────────
export const createBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      guest: guestData,
      specialRequests,
      paymentMethod,
      source,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!roomId || !checkIn || !checkOut) {
      return next(
        new AppError(
          'Please provide room ID, check-in date, and check-out date.',
          400
        )
      );
    }

    if (!guestData || !guestData.fullName || !guestData.phone) {
      return next(
        new AppError(
          'Please provide guest full name and phone number.',
          400
        )
      );
    }

    // ── Parse and validate dates ──────────────────────────────
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(
        new AppError('Invalid date format. Please use YYYY-MM-DD.', 400)
      );
    }

    if (checkOutDate <= checkInDate) {
      return next(
        new AppError(
          'Check-out date must be after check-in date.',
          400
        )
      );
    }

    // ── Calculate number of nights ────────────────────────────
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      return next(
        new AppError('Minimum booking is 1 night.', 400)
      );
    }

    // ── Check room exists and is active ───────────────────────
    const room = await Room.findById(roomId);
    if (!room) {
      return next(new AppError('Room not found.', 404));
    }

    if (!room.isActive) {
      return next(
        new AppError('This room is not available for bookings.', 400)
      );
    }

    if (room.status === 'maintenance') {
      return next(
        new AppError(
          'This room is currently under maintenance and cannot be booked.',
          400
        )
      );
    }

    // ── CONFLICT CHECK — prevent double booking ───────────────
    // Check if any existing active booking overlaps
    // with the requested dates for this room
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      // Overlap condition:
      // existing checkIn < new checkOut AND existing checkOut > new checkIn
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (conflictingBooking) {
      return next(
        new AppError(
          `Room ${room.roomNumber} is not available for the selected dates. It is already booked from ${conflictingBooking.checkIn.toDateString()} to ${conflictingBooking.checkOut.toDateString()}.`,
          409
        )
      );
    }

    // ── Find or create guest record ───────────────────────────
    // First try to find existing guest by phone number
    let guest = await Guest.findOne({ phone: guestData.phone });

    if (!guest) {
      // Guest does not exist — create a new guest record
      guest = await Guest.create({
        fullName: guestData.fullName.trim(),
        phone: guestData.phone.trim(),
        email: guestData.email?.trim().toLowerCase(),
        nationality: guestData.nationality || 'Ethiopia',
        idType: guestData.idType || 'kebele_id',
        idNumber: guestData.idNumber || 'Pending',
      });
    }

    // ── Calculate pricing with VAT ────────────────────────────
    const pricePerNight = room.price;
    const subtotal = pricePerNight * nights;
    const priceSummary = buildPriceSummary(subtotal);

    // ── Generate unique booking reference ─────────────────────
    const bookingRef = await generateBookingRef();

    // ── Create the booking ────────────────────────────────────
    const booking = await Booking.create({
      bookingRef,
      guest: guest._id,
      room: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      adults: adults || 1,
      children: children || 0,
      pricePerNight,
      subtotal: priceSummary.subtotal,
      vatAmount: priceSummary.vatAmount,
      totalAmount: priceSummary.total,
      amountPaid: 0,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: paymentMethod || undefined,
      source: source || 'website',
      specialRequests: specialRequests || undefined,
    });

    // ── Populate the booking for response ─────────────────────
    await booking.populate('guest', 'fullName phone email vip');
    await booking.populate('room', 'name roomNumber type floor price');

    // ── Create notification for admin ─────────────────────────
    // Find the admin user to notify
    const { default: User } = await import('../models/User');
    const adminUser = await User.findOne({ role: 'admin' });

    if (adminUser) {
      await Notification.createNotification({
        recipient: adminUser._id,
        type: 'info',
        event: 'NEW_BOOKING',
        title: `New Booking — ${bookingRef}`,
        message: `${guest.fullName} has booked ${room.name} (Room ${room.roomNumber}) for ${nights} night${nights > 1 ? 's' : ''} from ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}. Total: ${priceSummary.totalFormatted}`,
        link: `/admin/reservations/${booking._id}`,
        relatedBooking: booking._id,
        relatedGuest: guest._id,
        relatedRoom: room._id,
      });
    }

    res.status(201).json({
      success: true,
      message: `Booking confirmed! Your reference is ${bookingRef}.`,
      booking,
      priceSummary: {
        pricePerNight,
        nights,
        subtotal: priceSummary.subtotal,
        vatRate: VAT_RATE,
        vatAmount: priceSummary.vatAmount,
        total: priceSummary.total,
        subtotalFormatted: priceSummary.subtotalFormatted,
        vatAmountFormatted: priceSummary.vatAmountFormatted,
        totalFormatted: priceSummary.totalFormatted,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Confirm a pending booking
// @route   PATCH /api/bookings/:id/confirm
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const confirmBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id)
      .populate('guest', 'fullName phone')
      .populate('room', 'name roomNumber');

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    if (booking.status !== 'pending') {
      return next(
        new AppError(
          `Booking cannot be confirmed — current status is '${booking.status}'.`,
          400
        )
      );
    }

    booking.status = 'confirmed';
    await booking.save();

    // ── Update room status to reserved ────────────────────────
    await Room.findByIdAndUpdate(booking.room, { status: 'reserved' });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} confirmed booking ${booking.bookingRef}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingRef} confirmed successfully.`,
      booking,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const cancelBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('guest', 'fullName phone')
      .populate('room', 'name roomNumber');

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    // Cannot cancel a booking that is already checked in or completed
    if (
      booking.status === 'checked_in' ||
      booking.status === 'checked_out' ||
      booking.status === 'cancelled'
    ) {
      return next(
        new AppError(
          `Booking cannot be cancelled — current status is '${booking.status}'.`,
          400
        )
      );
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason || 'Cancelled by staff';
    await booking.save();

    // ── Free up the room ──────────────────────────────────────
    await Room.findByIdAndUpdate(booking.room, { status: 'available' });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} cancelled booking ${booking.bookingRef}. Reason: ${cancellationReason || 'Not specified'}. Previous status: ${previousStatus}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingRef} cancelled successfully.`,
      booking,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Check in a guest
// @route   PATCH /api/bookings/:id/checkin
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const checkInGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id)
      .populate('guest', 'fullName phone vip')
      .populate('room', 'name roomNumber type');

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    if (booking.status !== 'confirmed') {
      return next(
        new AppError(
          `Guest cannot be checked in — booking status is '${booking.status}'. Booking must be confirmed first.`,
          400
        )
      );
    }

    // ── Update booking status ─────────────────────────────────
    booking.status = 'checked_in';
    booking.actualCheckInTime = new Date();
    booking.checkedInBy = req.user?._id;
    await booking.save();

    // ── Update room status to occupied ────────────────────────
    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CHECKIN',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} checked in guest for booking ${booking.bookingRef}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Guest checked in successfully for booking ${booking.bookingRef}.`,
      booking,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Check out a guest
// @route   PATCH /api/bookings/:id/checkout
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const checkOutGuest = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id)
      .populate('guest')
      .populate('room', 'name roomNumber type');

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    if (booking.status !== 'checked_in') {
      return next(
        new AppError(
          `Guest cannot be checked out — booking status is '${booking.status}'. Guest must be checked in first.`,
          400
        )
      );
    }

    // ── Update booking status ─────────────────────────────────
    booking.status = 'checked_out';
    booking.actualCheckOutTime = new Date();
    booking.checkedOutBy = req.user?._id;
    await booking.save();

    // ── Update room status to cleaning ────────────────────────
    // Room needs to be cleaned before next guest
    await Room.findByIdAndUpdate(booking.room, { status: 'cleaning' });

    // ── Update guest loyalty points and stats ─────────────────
    const guest = booking.guest as {
      _id: string;
      fullName: string;
      loyaltyPoints: number;
      totalStays: number;
      totalSpent: number;
    };

    const pointsEarned = Math.floor(booking.totalAmount / 100);

    await Guest.findByIdAndUpdate(guest._id, {
      $inc: {
        loyaltyPoints: pointsEarned,
        totalStays: 1,
        totalSpent: booking.totalAmount,
      },
    });

    // ── Create housekeeping task ──────────────────────────────
    const { default: HousekeepingTask, DEFAULT_CHECKOUT_CHECKLIST } =
      await import('../models/HousekeepingTask');

    await HousekeepingTask.create({
      room: booking.room,
      booking: booking._id,
      taskType: 'checkout_clean',
      priority: 'normal',
      status: 'pending',
      checklist: DEFAULT_CHECKOUT_CHECKLIST,
      estimatedDuration: 45,
    });

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CHECKOUT',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} checked out guest for booking ${booking.bookingRef}. ${pointsEarned} loyalty points awarded.`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Guest checked out successfully. ${pointsEarned} loyalty points awarded to ${guest.fullName}. Room ${(booking.room as { roomNumber: string }).roomNumber} is now being cleaned.`,
      booking,
      loyaltyPointsEarned: pointsEarned,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Update booking payment status
// @route   PATCH /api/bookings/:id/payment
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const updatePaymentStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentStatus, paymentMethod, amountPaid } = req.body;

    const validPaymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'];

    if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
      return next(
        new AppError(
          `Invalid payment status. Valid values: ${validPaymentStatuses.join(', ')}.`,
          400
        )
      );
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    const previousPaymentStatus = booking.paymentStatus;

    booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (amountPaid !== undefined) booking.amountPaid = Number(amountPaid);

    await booking.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} updated payment for booking ${booking.bookingRef}: '${previousPaymentStatus}' → '${paymentStatus}' via ${paymentMethod || booking.paymentMethod || 'unspecified method'}`,
        previousData: { paymentStatus: previousPaymentStatus },
        newData: { paymentStatus, paymentMethod, amountPaid },
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status for booking ${booking.bookingRef} updated to '${paymentStatus}'.`,
      booking,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Delete a pending booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(
        new AppError(`No booking found with ID: ${req.params.id}`, 404)
      );
    }

    // Only allow deletion of pending bookings
    if (booking.status !== 'pending') {
      return next(
        new AppError(
          `Only pending bookings can be deleted. This booking status is '${booking.status}'. Use cancel instead.`,
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
        resource: 'Booking',
        resourceId: booking._id.toString(),
        description: `${req.user.name} deleted pending booking ${booking.bookingRef}`,
        previousData: booking.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingRef} deleted successfully.`,
    });
  }
);
