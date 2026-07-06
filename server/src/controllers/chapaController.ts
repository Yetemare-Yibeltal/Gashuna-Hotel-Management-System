// server/src/controllers/chapaController.ts
// ─────────────────────────────────────────────────────────────
// CHAPA PAYMENT CONTROLLER — Gashuna Hotel Management System
//
// Handles Chapa payment gateway integration:
//   POST  /api/chapa/initialize      → initialize payment session
//   GET   /api/chapa/verify/:tx_ref  → verify payment status
//   POST  /api/chapa/webhook         → handle Chapa webhook
//   GET   /api/chapa/payments        → list all Chapa payments
//   POST  /api/chapa/refund/:id      → request refund
//
// Payment flow:
//   1. Guest selects "Pay with Chapa" on booking review page
//   2. Frontend calls POST /api/chapa/initialize
//   3. Backend calls Chapa API to create payment session
//   4. Chapa returns checkout_url
//   5. Guest is redirected to Chapa checkout page
//   6. Guest pays using Telebirr, CBE Birr, or card
//   7. Chapa redirects guest back to success/failed page
//   8. Chapa also sends a webhook to our server
//   9. Backend verifies the payment with Chapa API
//  10. Booking/Invoice is marked as paid
//
// Chapa API documentation: https://developer.chapa.co
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import Invoice from '../models/Invoice';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { formatETB } from '../utils/formatCurrency';

// ── Chapa API Configuration ───────────────────────────────────
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL =
  process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

// ── Generate unique payment reference ────────────────────────
// Format: GSH-PAY-XXXXXX
const generatePaymentRef = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GSH-PAY-${suffix}`;
};

// ─────────────────────────────────────────────────────────────
// @desc    Initialize a Chapa payment session
// @route   POST /api/chapa/initialize
// @access  Public (called from booking wizard)
// ─────────────────────────────────────────────────────────────
export const initializePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      bookingId,
      invoiceId,
      amount,
      currency,
      email,
      firstName,
      lastName,
      phone,
      purpose,
    } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!amount || !email || !firstName || !lastName) {
      return next(
        new AppError(
          'Please provide amount, email, first name, and last name.',
          400
        )
      );
    }

    if (!bookingId && !invoiceId) {
      return next(
        new AppError(
          'Either booking ID or invoice ID is required.',
          400
        )
      );
    }

    if (!CHAPA_SECRET_KEY) {
      return next(
        new AppError(
          'Chapa secret key is not configured. Please contact support.',
          500
        )
      );
    }

    // ── Find the guest from booking or invoice ────────────────
    let guestId: string | undefined;

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return next(new AppError('Booking not found.', 404));
      }
      if (booking.paymentStatus === 'paid') {
        return next(
          new AppError(
            'This booking has already been paid.',
            400
          )
        );
      }
      guestId = booking.guest.toString();
    }

    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return next(new AppError('Invoice not found.', 404));
      }
      if (invoice.status === 'paid') {
        return next(
          new AppError(
            'This invoice has already been paid.',
            400
          )
        );
      }
      guestId = invoice.guest.toString();
    }

    // ── Generate unique transaction reference ─────────────────
    const txRef = generatePaymentRef();

    // ── Build callback URLs ───────────────────────────────────
    // These are the URLs Chapa redirects the guest to
    // after payment is completed or cancelled
    const clientUrl =
      process.env.CLIENT_URL || 'http://localhost:5173';

    const returnUrl = bookingId
      ? `${clientUrl}/payment/success?tx_ref=${txRef}&booking=${bookingId}`
      : `${clientUrl}/payment/success?tx_ref=${txRef}&invoice=${invoiceId}`;

    const cancelUrl = bookingId
      ? `${clientUrl}/payment/failed?tx_ref=${txRef}&booking=${bookingId}`
      : `${clientUrl}/payment/failed?tx_ref=${txRef}&invoice=${invoiceId}`;

    // ── Call Chapa API to initialize payment ──────────────────
    // POST https://api.chapa.co/v1/transaction/initialize
    let chapaResponse;

    try {
      chapaResponse = await axios.post(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        {
          amount: amount.toString(),
          currency: currency || 'ETB',
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone || '',
          tx_ref: txRef,
          callback_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/chapa/webhook`,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          customization: {
            title: 'Gashuna Hotel',
            description: `Payment for ${purpose || 'hotel booking'} — Dangla, Ethiopia`,
            logo: `${clientUrl}/logo.png`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return next(
        new AppError(
          `Chapa payment initialization failed: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`,
          500
        )
      );
    }

    // ── Create Payment record in database ─────────────────────
    const payment = await Payment.create({
      paymentRef: txRef,
      booking: bookingId || undefined,
      invoice: invoiceId || undefined,
      guest: guestId,
      purpose: purpose || (bookingId ? 'booking' : 'invoice'),
      gateway: 'chapa',
      amount: Number(amount),
      currency: currency || 'ETB',
      status: 'pending',
      chapaTxRef: txRef,
      chapaCheckoutUrl: chapaResponse.data?.data?.checkout_url,
      initiatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Payment session initialized successfully.',
      checkoutUrl: chapaResponse.data?.data?.checkout_url,
      txRef,
      paymentId: payment._id,
      amount: Number(amount),
      formattedAmount: formatETB(Number(amount)),
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Verify a Chapa payment by transaction reference
// @route   GET /api/chapa/verify/:tx_ref
// @access  Public (called after guest returns from Chapa)
// ─────────────────────────────────────────────────────────────
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tx_ref } = req.params;

    if (!tx_ref) {
      return next(
        new AppError('Transaction reference is required.', 400)
      );
    }

    if (!CHAPA_SECRET_KEY) {
      return next(
        new AppError('Chapa secret key is not configured.', 500)
      );
    }

    // ── Find the payment record ───────────────────────────────
    const payment = await Payment.findOne({ chapaTxRef: tx_ref });

    if (!payment) {
      return next(
        new AppError(
          `No payment record found for transaction: ${tx_ref}`,
          404
        )
      );
    }

    // ── Already verified — return cached result ───────────────
    if (payment.status === 'success') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and confirmed.',
        payment,
        alreadyVerified: true,
      });
    }

    // ── Call Chapa verify API ─────────────────────────────────
    // GET https://api.chapa.co/v1/transaction/verify/:tx_ref
    let verifyResponse;

    try {
      verifyResponse = await axios.get(
        `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          },
        }
      );
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return next(
        new AppError(
          `Chapa verification failed: ${axiosError.response?.data?.message || axiosError.message || 'Unknown error'}`,
          500
        )
      );
    }

    const chapaData = verifyResponse.data?.data;
    const chapaStatus = chapaData?.status;

    // ── Update payment record with Chapa response ─────────────
    payment.chapaResponseRaw = chapaData;
    payment.chapaVerifiedAt = new Date();
    payment.chapaTransactionId = chapaData?.id;

    if (chapaStatus === 'success') {
      // ── Payment successful ────────────────────────────────
      payment.status = 'success';
      payment.completedAt = new Date();
      await payment.save();

      // ── Update booking if linked ──────────────────────────
      if (payment.booking) {
        await Booking.findByIdAndUpdate(payment.booking, {
          paymentStatus: 'paid',
          paymentMethod: 'chapa',
          chapaTransactionRef: tx_ref,
          amountPaid: payment.amount,
          status: 'confirmed',
        });
      }

      // ── Update invoice if linked ──────────────────────────
      if (payment.invoice) {
        await Invoice.findByIdAndUpdate(payment.invoice, {
          status: 'paid',
          paymentMethod: 'chapa',
          chapaTransactionRef: tx_ref,
          amountPaid: payment.amount,
          paidAt: new Date(),
        });
      }

      // ── Create success notification ───────────────────────
      const { default: User } = await import('../models/User');
      const adminUser = await User.findOne({ role: 'admin' });

      if (adminUser) {
        await Notification.createNotification({
          recipient: adminUser._id,
          type: 'success',
          event: 'PAYMENT_RECEIVED',
          title: `Payment Received — ${formatETB(payment.amount)}`,
          message: `Chapa payment of ${formatETB(payment.amount)} received for ${payment.booking ? 'booking' : 'invoice'}. Transaction: ${tx_ref}`,
          relatedPayment: payment._id,
          relatedBooking: payment.booking,
        });
      }

      res.status(200).json({
        success: true,
        message: `Payment of ${formatETB(payment.amount)} verified and confirmed successfully.`,
        status: 'success',
        payment,
        chapaData,
      });
    } else if (chapaStatus === 'failed') {
      // ── Payment failed ────────────────────────────────────
      payment.status = 'failed';
      payment.failureReason =
        chapaData?.failure_reason || 'Payment failed on Chapa';
      await payment.save();

      res.status(200).json({
        success: false,
        message: 'Payment failed. Please try again.',
        status: 'failed',
        payment,
        chapaData,
      });
    } else {
      // ── Payment still pending ─────────────────────────────
      await payment.save();

      res.status(200).json({
        success: false,
        message: 'Payment is still pending.',
        status: chapaStatus || 'pending',
        payment,
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Handle Chapa webhook notification
// @route   POST /api/chapa/webhook
// @access  Public (called by Chapa servers automatically)
// ─────────────────────────────────────────────────────────────
export const chapaWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // ── Verify webhook signature ──────────────────────────────
    // Chapa signs webhook payloads with our webhook secret
    // We verify this to ensure the request is really from Chapa
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = req.headers['x-chapa-signature'] as string;

      if (signature) {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (signature !== expectedSignature) {
          // Invalid signature — not from Chapa, ignore it
          res.status(401).json({ message: 'Invalid signature' });
          return;
        }
      }
    }

    const { trx_ref, status, amount } = req.body;

    // ── Find payment by transaction reference ─────────────────
    const payment = await Payment.findOne({ chapaTxRef: trx_ref });

    if (!payment) {
      // Payment not found — send 200 to acknowledge receipt
      // (we don't want Chapa to keep retrying)
      res.status(200).json({ message: 'Webhook received' });
      return;
    }

    // ── Skip if already processed ─────────────────────────────
    if (payment.status === 'success' || payment.status === 'failed') {
      res.status(200).json({ message: 'Already processed' });
      return;
    }

    // ── Process the webhook based on status ───────────────────
    if (status === 'success') {
      payment.status = 'success';
      payment.completedAt = new Date();
      payment.chapaResponseRaw = req.body;
      await payment.save();

      // Update booking or invoice
      if (payment.booking) {
        await Booking.findByIdAndUpdate(payment.booking, {
          paymentStatus: 'paid',
          paymentMethod: 'chapa',
          chapaTransactionRef: trx_ref,
          amountPaid: amount || payment.amount,
          status: 'confirmed',
        });
      }

      if (payment.invoice) {
        await Invoice.findByIdAndUpdate(payment.invoice, {
          status: 'paid',
          paymentMethod: 'chapa',
          chapaTransactionRef: trx_ref,
          paidAt: new Date(),
        });
      }
    } else if (status === 'failed') {
      payment.status = 'failed';
      payment.failureReason = 'Payment failed via webhook';
      payment.chapaResponseRaw = req.body;
      await payment.save();
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ message: 'Webhook processed successfully' });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get all Chapa payment records
// @route   GET /api/chapa/payments
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getChapaPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;

    const filter: Record<string, unknown> = { gateway: 'chapa' };
    if (status) filter.status = status;

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

    // ── Calculate totals ──────────────────────────────────────
    const successfulPayments = await Payment.aggregate([
      { $match: { gateway: 'chapa', status: 'success' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totals = successfulPayments[0] || {
      totalAmount: 0,
      count: 0,
    };

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      totalRevenue: totals.totalAmount,
      totalTransactions: totals.count,
      formattedTotalRevenue: formatETB(totals.totalAmount),
      payments,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Request a refund for a Chapa payment
// @route   POST /api/chapa/refund/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
export const requestRefund = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { reason, refundAmount } = req.body;

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
        new AppError(
          'Can only refund successful payments.',
          400
        )
      );
    }

    if (payment.gateway !== 'chapa') {
      return next(
        new AppError(
          'Refunds through this endpoint are only for Chapa payments.',
          400
        )
      );
    }

    const amountToRefund = refundAmount || payment.amount;

    if (amountToRefund > payment.amount) {
      return next(
        new AppError(
          `Refund amount (${formatETB(amountToRefund)}) cannot exceed original payment amount (${formatETB(payment.amount)}).`,
          400
        )
      );
    }

    // ── Update payment record ─────────────────────────────────
    payment.status = 'refunded';
    payment.refundedAmount = amountToRefund;
    payment.refundedAt = new Date();
    await payment.save();

    // ── Update linked booking payment status ──────────────────
    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: 'refunded',
      });
    }

    // ── Log the refund ────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Payment',
        resourceId: payment._id.toString(),
        description: `${req.user.name} processed refund of ${formatETB(amountToRefund)} for payment ${payment.paymentRef}. Reason: ${reason || 'Not specified'}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Refund of ${formatETB(amountToRefund)} processed successfully for payment ${payment.paymentRef}.`,
      payment,
    });
  }
);
