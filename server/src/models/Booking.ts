// server/src/models/Booking.ts
// ─────────────────────────────────────────────────────────────
// BOOKING MODEL — Gashuna Hotel Management System
//
// Represents every reservation made at Gashuna Hotel.
// Links a Guest to a Room for a specific date range.
//
// This is the most important model in the system —
// almost every module references bookings:
//   - Front desk check-in/check-out
//   - Billing and invoices
//   - Reports and revenue analytics
//   - Housekeeping (triggered after checkout)
//   - Guest CRM (loyalty points awarded after checkout)
//
// Booking status lifecycle:
//   pending      → just created, awaiting confirmation
//   confirmed    → payment received or manually confirmed
//   checked_in   → guest has arrived and is in the room
//   checked_out  → guest has left, stay completed
//   cancelled    → booking was cancelled before check-in
//   no_show      → guest never arrived for their booking
//
// Payment status:
//   unpaid   → no payment received yet
//   partial  → deposit paid, balance due
//   paid     → full amount paid
//   refunded → payment was refunded (cancellation)
//
// Payment methods:
//   cash, telebirr, cbe_birr, chapa, card, bank_transfer
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export type PaymentMethod =
  | 'cash'
  | 'telebirr'
  | 'cbe_birr'
  | 'chapa'
  | 'card'
  | 'bank_transfer';

export type BookingSource = 'website' | 'walk_in' | 'phone' | 'agent';

// ── Booking Document Interface ────────────────────────────────
export interface IBooking extends Document {
  bookingRef: string;
  guest: Types.ObjectId;
  room: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  pricePerNight: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  chapaTransactionRef?: string;
  source: BookingSource;
  specialRequests?: string;
  actualCheckInTime?: Date;
  actualCheckOutTime?: Date;
  checkedInBy?: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Booking Schema ─────────────────────────────────────────────
const bookingSchema = new Schema<IBooking>(
  {
    bookingRef: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      uppercase: true,
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required for a booking'],
    },

    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required for a booking'],
    },

    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },

    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
      validate: {
        validator: function (this: IBooking, value: Date) {
          // Check-out must always be after check-in
          return value > this.checkIn;
        },
        message: 'Check-out date must be after check-in date',
      },
    },

    nights: {
      type: Number,
      required: true,
      min: [1, 'Booking must be at least 1 night'],
    },

    adults: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 adult is required'],
    },

    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative'],
    },

    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Room charge before VAT — pricePerNight × nights
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // 15% VAT amount calculated from subtotal
    vatAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // subtotal + vatAmount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Tracks partial payments — useful for deposit-based bookings
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'checked_in',
          'checked_out',
          'cancelled',
          'no_show',
        ],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'partial', 'paid', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'unpaid',
    },

    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'telebirr',
        'cbe_birr',
        'chapa',
        'card',
        'bank_transfer',
      ],
    },

    // Chapa's unique transaction reference — used to verify
    // payment status by calling Chapa's verify API
    chapaTransactionRef: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      enum: ['website', 'walk_in', 'phone', 'agent'],
      default: 'website',
    },

    specialRequests: {
      type: String,
      trim: true,
    },

    // Actual time guest physically checked in
    // (may differ from the booked checkIn date/time)
    actualCheckInTime: {
      type: Date,
    },

    actualCheckOutTime: {
      type: Date,
    },

    // Which staff member processed the check-in
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Critical index for the availability conflict check —
// finds overlapping bookings for a specific room quickly
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

// Speeds up filtering bookings by status (admin dashboard)
bookingSchema.index({ status: 1 });

// Speeds up looking up a booking by its reference number
bookingSchema.index({ bookingRef: 1 });

// Speeds up finding all bookings for a specific guest
bookingSchema.index({ guest: 1 });

// ── Virtual: Balance Due ──────────────────────────────────────
// Computed field — totalAmount minus amountPaid
bookingSchema.virtual('balanceDue').get(function (this: IBooking) {
  return Math.max(0, this.totalAmount - this.amountPaid);
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Booking: Model<IBooking> = model<IBooking>(
  'Booking',
  bookingSchema
);

export default Booking;
