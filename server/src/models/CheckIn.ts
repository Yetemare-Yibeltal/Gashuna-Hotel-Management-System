// server/src/models/CheckIn.ts
// ─────────────────────────────────────────────────────────────
// CHECK-IN RECORD MODEL — Gashuna Hotel Management System
//
// Represents the formal check-in event when a guest
// physically arrives at Gashuna Hotel and is assigned
// their room by the receptionist.
//
// IMPORTANT DISTINCTION:
//   Booking  → the RESERVATION (made in advance, online or walk-in)
//   CheckIn  → the ARRIVAL RECORD (when guest physically arrives)
//
// A CheckIn record captures:
//   - Exact arrival date and time
//   - Which receptionist processed the check-in
//   - Room key number issued to the guest
//   - Security deposit collected at check-in (in ETB)
//   - Guest ID verification (type and number confirmed at desk)
//   - Vehicle number (if guest has a car in hotel parking)
//   - Expected checkout date confirmed with guest
//   - Any special arrival notes
//
// When a guest checks out:
//   - Checkout time is recorded
//   - Which staff member processed the checkout
//   - Security deposit refund amount
//   - Any deductions from the deposit (damages, etc.)
//   - Final room condition notes
//
// This record is required for Ethiopian hotel regulations
// which require all hotels to maintain guest arrival records
// with valid ID documentation.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type CheckInStatus = 'checked_in' | 'checked_out';

// ── CheckIn Document Interface ────────────────────────────────
export interface ICheckIn extends Document {
  booking: Types.ObjectId;
  guest: Types.ObjectId;
  room: Types.ObjectId;
  status: CheckInStatus;

  // ── Arrival details ──────────────────────────────────────────
  checkInTime: Date;
  checkedInBy: Types.ObjectId;
  roomKeyNumber?: string;
  securityDeposit: number;
  depositCurrency: string;
  depositPaymentMethod?: string;

  // ── ID Verification ──────────────────────────────────────────
  idVerified: boolean;
  idType?: string;
  idNumber?: string;

  // ── Additional arrival info ──────────────────────────────────
  vehicleNumber?: string;
  numberOfGuests: number;
  arrivalNotes?: string;
  expectedCheckOutDate: Date;

  // ── Checkout details ─────────────────────────────────────────
  checkOutTime?: Date;
  checkedOutBy?: Types.ObjectId;
  depositRefunded: number;
  depositDeduction: number;
  depositDeductionReason?: string;
  roomConditionNotes?: string;
  checkoutNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ── CheckIn Schema ─────────────────────────────────────────────
const checkInSchema = new Schema<ICheckIn>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required for check-in'],
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required for check-in'],
    },

    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required for check-in'],
    },

    status: {
      type: String,
      enum: {
        values: ['checked_in', 'checked_out'],
        message: '{VALUE} is not a valid check-in status',
      },
      default: 'checked_in',
    },

    // ── Arrival Details ─────────────────────────────────────────
    checkInTime: {
      type: Date,
      required: [true, 'Check-in time is required'],
      default: Date.now,
    },

    // Which receptionist processed this check-in
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff member who processed check-in is required'],
    },

    // The physical room key number given to the guest
    // Example: "KEY-201-A"
    roomKeyNumber: {
      type: String,
      trim: true,
    },

    // Security deposit collected at check-in in ETB
    // Refunded at checkout minus any damage deductions
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },

    depositCurrency: {
      type: String,
      default: 'ETB',
    },

    depositPaymentMethod: {
      type: String,
      enum: ['cash', 'telebirr', 'cbe_birr', 'chapa', 'card'],
    },

    // ── ID Verification ─────────────────────────────────────────
    // Ethiopian hotel regulations require guest ID to be
    // checked and recorded at check-in
    idVerified: {
      type: Boolean,
      default: false,
    },

    idType: {
      type: String,
      enum: ['kebele_id', 'passport', 'driving_license', 'national_id'],
    },

    idNumber: {
      type: String,
      trim: true,
    },

    // ── Additional Arrival Info ──────────────────────────────────
    // Guest vehicle plate number if they are using the hotel parking
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Total number of guests occupying the room
    // (may differ from booking if guests changed their party size)
    numberOfGuests: {
      type: Number,
      required: true,
      min: [1, 'At least 1 guest is required'],
      default: 1,
    },

    arrivalNotes: {
      type: String,
      trim: true,
    },

    // The date the guest is expected to check out
    // Confirmed with guest at check-in
    expectedCheckOutDate: {
      type: Date,
      required: [true, 'Expected check-out date is required'],
    },

    // ── Checkout Details ────────────────────────────────────────
    checkOutTime: {
      type: Date,
    },

    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // How much of the security deposit was returned to the guest
    depositRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },

    // How much was deducted from the deposit (damages, etc.)
    depositDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Reason for any deposit deduction
    // Example: "Broken bathroom mirror — ETB 500 deducted"
    depositDeductionReason: {
      type: String,
      trim: true,
    },

    // Notes about the room condition after the guest left
    // Example: "Room was left clean and in good condition"
    roomConditionNotes: {
      type: String,
      trim: true,
    },

    checkoutNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// One booking should only have one active check-in record
checkInSchema.index({ booking: 1 }, { unique: true });

// Speeds up finding check-in records for a specific room
checkInSchema.index({ room: 1 });

// Speeds up finding check-in records for a specific guest
checkInSchema.index({ guest: 1 });

// ── Virtual: Length of Stay ───────────────────────────────────
// Calculates actual length of stay in nights
// (may differ from booked nights if guest extended or left early)
checkInSchema.virtual('actualNights').get(function (this: ICheckIn) {
  const checkOut = this.checkOutTime || new Date();
  const diffMs = checkOut.getTime() - this.checkInTime.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// ── Virtual: Deposit Balance ──────────────────────────────────
// How much of the deposit is still held
checkInSchema.virtual('depositBalance').get(function (this: ICheckIn) {
  return Math.max(
    0,
    this.securityDeposit - this.depositRefunded - this.depositDeduction
  );
});

// ── Virtual: Formatted Security Deposit ──────────────────────
checkInSchema.virtual('formattedSecurityDeposit').get(function (
  this: ICheckIn
) {
  return `ETB ${this.securityDeposit.toLocaleString('en-US')}`;
});

checkInSchema.set('toJSON', { virtuals: true });
checkInSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const CheckIn: Model<ICheckIn> = model<ICheckIn>(
  'CheckIn',
  checkInSchema
);

export default CheckIn;
