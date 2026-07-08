import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import Invoice from '../models/Invoice';
import Booking from '../models/Booking';
import Guest from '../models/Guest';
import AuditLog from '../models/AuditLog';
import generateInvoiceNumber from '../utils/generateInvoiceNumber';
import { buildPriceSummary, formatETB, VAT_RATE } from '../utils/formatCurrency';
import { sendInvoiceEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// ─────────────────────────────────────────────────────────────
// @desc    Get all invoices with filters
// @route   GET /api/invoices
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getInvoices = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      guestId,
      bookingId,
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
    if (guestId) filter.guest = guestId;
    if (bookingId) filter.booking = bookingId;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.issuedAt = dateFilter;
    }

    // ── Pagination ────────────────────────────────────────────
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──────────────────────────────────────────────────
    const sortField = (sortBy as string) || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, number> = { [sortField]: sortOrder };

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('guest', 'fullName phone email vip')
        .populate('booking', 'bookingRef checkIn checkOut nights')
        .populate('issuedBy', 'name role')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      invoices,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const getInvoiceStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { year, month } = req.query;

    const currentYear =
      parseInt(year as string) || new Date().getFullYear();
    const currentMonth =
      parseInt(month as string) || new Date().getMonth() + 1;

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59
    );

    // ── Overall stats ─────────────────────────────────────────
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: 'issued' }),
      Invoice.countDocuments({ status: 'overdue' }),
    ]);

    // ── Monthly revenue ───────────────────────────────────────
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalVAT: { $sum: '$vatAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Revenue by payment method ─────────────────────────────
    const paymentMethodStats = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const monthly = monthlyRevenue[0] || {
      totalRevenue: 0,
      totalVAT: 0,
      count: 0,
    };

    res.status(200).json({
      success: true,
      stats: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        monthlyRevenue: monthly.totalRevenue,
        monthlyVAT: monthly.totalVAT,
        monthlyInvoiceCount: monthly.count,
        formattedMonthlyRevenue: formatETB(monthly.totalRevenue),
        formattedMonthlyVAT: formatETB(monthly.totalVAT),
        paymentMethodBreakdown: paymentMethodStats,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getInvoiceById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invoice = await Invoice.findById(req.params.id)
      .populate('guest')
      .populate('booking')
      .populate('issuedBy', 'name role email');

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Get invoice by booking ID
// @route   GET /api/invoices/booking/:bookingId
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const getInvoiceByBooking = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invoice = await Invoice.findOne({
      booking: req.params.bookingId,
    })
      .populate('guest')
      .populate('booking')
      .populate('issuedBy', 'name role');

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found for booking: ${req.params.bookingId}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const createInvoice = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { bookingId, guestId, items, notes, dueDate } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!guestId) {
      return next(
        new AppError('Guest ID is required to create an invoice.', 400)
      );
    }

    if (!items || items.length === 0) {
      return next(
        new AppError(
          'At least one line item is required for an invoice.',
          400
        )
      );
    }

    // ── Verify guest exists ───────────────────────────────────
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    // ── Verify booking exists if provided ─────────────────────
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return next(new AppError('Booking not found.', 404));
      }

      // Check if invoice already exists for this booking
      const existingInvoice = await Invoice.findOne({
        booking: bookingId,
        status: { $nin: ['cancelled'] },
      });

      if (existingInvoice) {
        return next(
          new AppError(
            `An invoice already exists for this booking: ${existingInvoice.invoiceNumber}`,
            400
          )
        );
      }
    }

    // ── Validate all line items ───────────────────────────────
    for (const item of items) {
      if (!item.description || !item.unitPrice || !item.quantity) {
        return next(
          new AppError(
            'Each line item must have a description, unit price, and quantity.',
            400
          )
        );
      }
      if (item.unitPrice < 0) {
        return next(
          new AppError('Unit price cannot be negative.', 400)
        );
      }
      if (item.quantity < 1) {
        return next(
          new AppError('Quantity must be at least 1.', 400)
        );
      }
    }

    // ── Generate invoice number ───────────────────────────────
    const invoiceNumber = await generateInvoiceNumber();

    // ── Create invoice ────────────────────────────────────────
    // Pre-save hook in Invoice model calculates
    // subtotal, vatAmount, and total automatically
    const invoice = await Invoice.create({
      invoiceNumber,
      booking: bookingId || undefined,
      guest: guestId,
      items: items.map(
        (item: {
          category?: string;
          description: string;
          quantity: number;
          unitPrice: number;
        }) => ({
          category: item.category || 'other',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })
      ),
      subtotal: 0,
      vatRate: VAT_RATE,
      vatAmount: 0,
      total: 0,
      status: 'draft',
      issuedAt: new Date(),
      dueDate: dueDate || undefined,
      issuedBy: req.user?._id,
      notes: notes || undefined,
    });

    // Populate for response
    await invoice.populate('guest', 'fullName phone email');
    await invoice.populate('booking', 'bookingRef checkIn checkOut');

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'Invoice',
        resourceId: invoice._id.toString(),
        description: `${req.user.name} created invoice ${invoiceNumber} for ${guest.fullName}. Total: ${formatETB(invoice.total)}`,
        newData: invoice.toObject(),
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully. Total: ${formatETB(invoice.total)} (incl. ${VAT_RATE * 100}% VAT)`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Add a line item to an existing invoice
// @route   POST /api/invoices/:id/items
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const addInvoiceItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { category, description, quantity, unitPrice } = req.body;

    // ── Validate item ─────────────────────────────────────────
    if (!description || !unitPrice || !quantity) {
      return next(
        new AppError(
          'Please provide description, quantity, and unit price.',
          400
        )
      );
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    // ── Cannot add items to paid or cancelled invoices ────────
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return next(
        new AppError(
          `Cannot add items to a ${invoice.status} invoice.`,
          400
        )
      );
    }

    // ── Add the new item ──────────────────────────────────────
    invoice.items.push({
      category: category || 'other',
      description: description.trim(),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      total: Number(quantity) * Number(unitPrice),
    });

    // Pre-save hook recalculates totals automatically
    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Item "${description}" added to invoice ${invoice.invoiceNumber}. New total: ${formatETB(invoice.total)}`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Remove a line item from an invoice
// @route   DELETE /api/invoices/:id/items/:itemIndex
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const removeInvoiceItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const itemIndex = parseInt(req.params.itemIndex);

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return next(
        new AppError(
          `Cannot remove items from a ${invoice.status} invoice.`,
          400
        )
      );
    }

    if (itemIndex < 0 || itemIndex >= invoice.items.length) {
      return next(
        new AppError(
          `Invalid item index: ${itemIndex}. Invoice has ${invoice.items.length} items.`,
          400
        )
      );
    }

    if (invoice.items.length === 1) {
      return next(
        new AppError(
          'Cannot remove the last item. An invoice must have at least one item.',
          400
        )
      );
    }

    const removedItem = invoice.items[itemIndex];
    invoice.items.splice(itemIndex, 1);
    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Item "${removedItem.description}" removed from invoice ${invoice.invoiceNumber}. New total: ${formatETB(invoice.total)}`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Issue an invoice (change status from draft to issued)
// @route   PATCH /api/invoices/:id/issue
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const issueInvoice = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const invoice = await Invoice.findById(req.params.id)
      .populate('guest', 'fullName phone email')
      .populate('booking', 'bookingRef');

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (invoice.status !== 'draft') {
      return next(
        new AppError(
          `Invoice cannot be issued — current status is '${invoice.status}'.`,
          400
        )
      );
    }

    invoice.status = 'issued';
    invoice.issuedAt = new Date();
    await invoice.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Invoice',
        resourceId: invoice._id.toString(),
        description: `${req.user.name} issued invoice ${invoice.invoiceNumber}. Total: ${formatETB(invoice.total)}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} issued successfully. Total: ${formatETB(invoice.total)}`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Mark invoice as paid
// @route   PATCH /api/invoices/:id/pay
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const markInvoicePaid = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentMethod, amountPaid, chapaTransactionRef } = req.body;

    const validPaymentMethods = [
      'cash',
      'telebirr',
      'cbe_birr',
      'chapa',
      'card',
      'bank_transfer',
    ];

    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return next(
        new AppError(
          `Please provide a valid payment method: ${validPaymentMethods.join(', ')}.`,
          400
        )
      );
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate('guest', 'fullName phone email')
      .populate('booking', 'bookingRef');

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (invoice.status === 'paid') {
      return next(
        new AppError(
          `Invoice ${invoice.invoiceNumber} is already paid.`,
          400
        )
      );
    }

    if (invoice.status === 'cancelled') {
      return next(
        new AppError(
          `Cannot mark a cancelled invoice as paid.`,
          400
        )
      );
    }

    // ── Update invoice ────────────────────────────────────────
    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.amountPaid = amountPaid || invoice.total;
    invoice.paidAt = new Date();

    if (chapaTransactionRef) {
      invoice.chapaTransactionRef = chapaTransactionRef;
    }

    await invoice.save();

    // ── Update linked booking payment status ──────────────────
    if (invoice.booking) {
      await Booking.findByIdAndUpdate(invoice.booking, {
        paymentStatus: 'paid',
        paymentMethod,
        amountPaid: invoice.amountPaid,
      });
    }

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'PAYMENT',
        resource: 'Invoice',
        resourceId: invoice._id.toString(),
        description: `${req.user.name} marked invoice ${invoice.invoiceNumber} as paid. Amount: ${formatETB(invoice.total)} via ${paymentMethod}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} marked as paid. Amount: ${formatETB(invoice.total)} via ${paymentMethod}.`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Cancel an invoice
// @route   PATCH /api/invoices/:id/cancel
// @access  Private (Admin, Manager)
// ─────────────────────────────────────────────────────────────
export const cancelInvoice = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    if (invoice.status === 'paid') {
      return next(
        new AppError(
          'Cannot cancel a paid invoice. Please process a refund instead.',
          400
        )
      );
    }

    if (invoice.status === 'cancelled') {
      return next(
        new AppError('Invoice is already cancelled.', 400)
      );
    }

    invoice.status = 'cancelled';
    if (reason) invoice.notes = `Cancelled: ${reason}`;
    await invoice.save();

    // ── Audit log ─────────────────────────────────────────────
    if (req.user) {
      await AuditLog.logAction({
        user: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'Invoice',
        resourceId: invoice._id.toString(),
        description: `${req.user.name} cancelled invoice ${invoice.invoiceNumber}. Reason: ${reason || 'Not specified'}`,
        ipAddress: req.ip,
        success: true,
      });
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} cancelled successfully.`,
      invoice,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// @desc    Email invoice to guest
// @route   POST /api/invoices/:id/email
// @access  Private (Admin, Manager, Receptionist)
// ─────────────────────────────────────────────────────────────
export const emailInvoice = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const invoice = await Invoice.findById(req.params.id).populate(
      'guest',
      'fullName phone email'
    );

    if (!invoice) {
      return next(
        new AppError(
          `No invoice found with ID: ${req.params.id}`,
          404
        )
      );
    }

    const guest = invoice.guest as {
      fullName: string;
      email?: string;
    };

    if (!guest.email) {
      return next(
        new AppError(
          `Guest ${guest.fullName} does not have an email address on file. Please update their profile first.`,
          400
        )
      );
    }

    // ── Send invoice email ────────────────────────────────────
    try {
      await sendInvoiceEmail(guest.email, {
        guestName: guest.fullName,
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        vatAmount: invoice.vatAmount,
        total: invoice.total,
        paymentMethod: invoice.paymentMethod || 'Pending',
        paidAt: invoice.paidAt
          ? invoice.paidAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Not yet paid',
      });
    } catch {
      return next(
        new AppError(
          `Failed to send invoice email to ${guest.email}. Please try again.`,
          500
        )
      );
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent to ${guest.email} successfully.`,
    });
  }
);
