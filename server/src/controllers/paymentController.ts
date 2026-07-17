import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import Invoice from '../models/Invoice';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

export const getPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      gateway,
      channel,
      guestId,
      bookingId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;
    if (channel) filter.channel = channel;
    if (guestId) filter.guest = guestId;
    if (bookingId) filter.booking = bookingId;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.createdAt = dateFilter;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('guest', 'fullName phone email')
        .populate('booking', 'bookingRef checkIn checkOut')
        .populate('invoice', 'invoiceNumber total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      payments,
    });
  }
);

export const getPaymentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const [totalPayments, successfulPayments, failedPayments, pendingPayments] =
      await Promise.all([
        Payment.countDocuments(),
        Payment.countDocuments({ status: 'success' }),
        Payment.countDocuments({ status: 'failed' }),
        Payment.countDocuments({ status: 'pending' }),
      ]);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          completedAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const todayRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          completedAt: { $gte: today, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const channelBreakdown = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const gatewayBreakdown = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: '$gateway',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const monthlyTotal = monthlyRevenue[0]?.total || 0;
    const todayTotal = todayRevenue[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPayments,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate:
          totalPayments > 0
            ? Math.round(
                (successfulPayments / totalPayments) * 100 * 10
              ) / 10
            : 0,
        monthlyRevenue: monthlyTotal,
        todayRevenue: todayTotal,
        formattedMonthlyRevenue: formatETB(monthlyTotal),
        formattedTodayRevenue: formatETB(todayTotal),
        channelBreakdown,
        gatewayBreakdown,
      },
    });
  }
);

export const getPaymentById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const payment = await Payment.findById(req.params.id)
      .populate('guest', 'fullName phone email vip')
      .populate('booking', 'bookingRef checkIn checkOut totalAmount')
      .populate('invoice', 'invoiceNumber total status');

    if (!payment) {
      return next(
        new AppError(
          `No payment found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      payment,
    });
  }
);

export const createManualPayment = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      guestId,
      bookingId,
      invoiceId,
      amount,
      channel,
      purpose,
      notes,
    } = req.body;

    if (!guestId || !amount || !channel) {
      return next(
        new AppError(
          'Please provide guest ID, amount, and payment channel.',
          400
        )
      );
    }

    if (!bookingId && !invoiceId) {
      return next(
        new AppError(
          'Please provide either a booking ID or invoice ID.',
          400
        )
      );
    }

    const validChannels = [
      'cash',
      'bank_transfer',
      'telebirr',
      'cbebirr',
      'card',
    ];

    if (!validChannels.includes(channel)) {
      return next(
        new AppError(
          `Invalid channel. Valid values: ${validChannels.join(', ')}.`,
          400
        )
      );
    }

    const paymentRef = `GSH-MAN-${Date.now()}`;

    const payment = await Payment.create({
      paymentRef,
      guest: guestId,
      booking: bookingId || undefined,
      invoice: invoiceId || undefined,
      purpose: purpose || (bookingId ? 'booking' : 'invoice'),
      gateway: 'manual',
      channel,
      amount: Number(amount),
      currency: 'ETB',
      status: 'success',
      initiatedAt: new Date(),
      completedAt: new Date(),
    });

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid',
        paymentMethod: channel,
        amountPaid: Number(amount),
      });
    }

    if (invoiceId) {
      await Invoice.findByIdAndUpdate(invoiceId, {
        status: 'paid',
        paymentMethod: channel,
        amountPaid: Number(amount),
        paidAt: new Date(),
      });
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Payment',
        resourceId: payment._id.toString(),
        description: `${req.user.name} recorded manual payment of ${formatETB(Number(amount))} via ${channel}. Ref: ${paymentRef}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Manual payment of ${formatETB(Number(amount))} recorded successfully via ${channel}.`,
      payment,
    });
  }
);

export const refundPayment = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { refundAmount, reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(
        new AppError(
          `No payment found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (payment.status !== 'success') {
      return next(
        new AppError('Can only refund successful payments.', 400)
      );
    }

    if (payment.status === 'refunded') {
      return next(
        new AppError('This payment has already been refunded.', 400)
      );
    }

    const amountToRefund = refundAmount
      ? Number(refundAmount)
      : payment.amount;

    if (amountToRefund > payment.amount) {
      return next(
        new AppError(
          `Refund amount ${formatETB(amountToRefund)} cannot exceed original payment ${formatETB(payment.amount)}.`,
          400
        )
      );
    }

    payment.status = 'refunded';
    payment.refundedAmount = amountToRefund;
    payment.refundedAt = new Date();
    await payment.save();

    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: 'refunded',
      });
    }

    if (payment.invoice) {
      await Invoice.findByIdAndUpdate(payment.invoice, {
        status: 'cancelled',
      });
    }

    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Payment',
        resourceId: payment._id.toString(),
        description: `${req.user.name} refunded ${formatETB(amountToRefund)} for payment ${payment.paymentRef}. Reason: ${reason || 'Not specified'}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Refund of ${formatETB(amountToRefund)} processed for payment ${payment.paymentRef}.`,
      payment,
    });
  }
);
