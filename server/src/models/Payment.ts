// server/src/models/Payment.ts
// ─────────────────────────────────────────────────────────────
// PAYMENT MODEL — Gashuna Hotel Management System
//
// Records every payment transaction processed by the system,
// with special detail for Chapa payment gateway transactions.
//
// While Booking and Invoice store a simple paymentStatus field,
// this Payment model stores the FULL transaction record:
//   - Chapa transaction reference (tx_ref)
//   - Chapa's own transaction ID
//   - Verification response from Chapa's API
//   - Amount, currency, and fees
//   - Full status history
//
// This provides a complete audit trail for:
//   - Reconciling hotel accounts at month end
//   - Resolving guest payment disputes
//   - Tracking failed/abandoned payment attempts
//   - Chapa webhook event logging
//
// Payment flow with Chapa:
//   1. Guest reaches booking review step, selects "Pay with Chapa"
//   2. Backend calls Chapa /transaction/initialize
//      → creates a Payment record with status 'pending'
//   3. Guest redirected to Chapa's hosted checkout page
//   4. Guest completes payment (Telebirr, CBE, card, etc.)
//   5. Chapa sends webhook OR guest is redirected back
//   6. Backend calls Chapa /transaction/verify/:tx_ref
//      → updates Payment record to 'success' or 'failed'
//   7. If success, linked Booking/Invoice is marked paid
//
// Payment methods supported via Chapa:
//   telebirr, cbebirr, amole, awash, dashen, abyssinia, card
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type PaymentGateway = 'chapa' | 'manual';

export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentChannel =
  | 'telebirr'
  | 'cbebirr'
  | 'amole'
  | 'awash'
  | 'dashen'
  | 'abyssinia'
  | 'card'
  | 'cash'
  | 'bank_transfer';

export type PaymentPurpose = 'booking' | 'invoice' | 'deposit';

// ── Payment Document Interface ────────────────────────────────
export interface IPayment extends Document {
  paymentRef: string;
  booking?: Types.ObjectId;
  invoice?: Types.ObjectId;
  guest: Types.ObjectId;
  purpose: PaymentPurpose;
  gateway: PaymentGateway;
  channel?: PaymentChannel;
  amount: number;
  currency: string;
  status: PaymentStatus;

  // ── Chapa-specific fields ────────────────────────────────────
  chapaTxRef?: string;
  chapaTransactionId?: string;
  chapaCheckoutUrl?: string;
  chapaResponseRaw?: Record<string, unknown>;
  chapaVerifiedAt?: Date;

  failureReason?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  initiatedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Payment Schema ───────────────────────────────────────────────
const paymentSchema = new Schema<IPayment>(
  {
    // Our own internal payment reference
    // Format: PAY-XXXXXX
    paymentRef: {
      type: String,
      required: [true, 'Payment reference is required'],
      unique: true,
      uppercase: true,
    },

    // A payment is usually linked to either a booking or an invoice
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required for a payment record'],
    },

    purpose: {
      type: String,
      enum: {
        values: ['booking', 'invoice', 'deposit'],
        message: '{VALUE} is not a valid payment purpose',
      },
      required: [true, 'Payment purpose is required'],
    },

    // chapa = paid through the Chapa payment gateway
    // manual = cash/bank transfer recorded manually by staff
    gateway: {
      type: String,
      enum: {
        values: ['chapa', 'manual'],
        message: '{VALUE} is not a valid payment gateway',
      },
      required: [true, 'Payment gateway is required'],
    },

    // The specific channel used within Chapa, or manual method
    channel: {
      type: String,
      enum: [
        'telebirr',
        'cbebirr',
        'amole',
        'awash',
        'dashen',
        'abyssinia',
        'card',
        'cash',
        'bank_transfer',
      ],
    },

    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    currency: {
      type: String,
      default: 'ETB',
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },

    // ── Chapa Integration Fields ────────────────────────────────

    // The tx_ref WE generate and send to Chapa when initializing
    // This is what we use to verify the transaction later
    chapaTxRef: {
      type: String,
      trim: true,
    },

    // Chapa's own internal transaction ID returned after verification
    chapaTransactionId: {
      type: String,
      trim: true,
    },

    // The hosted checkout URL Chapa returns — guest is redirected here
    chapaCheckoutUrl: {
      type: String,
      trim: true,
    },

    // Full raw JSON response from Chapa's verify endpoint
    // Stored for debugging and audit purposes
    chapaResponseRaw: {
      type: Schema.Types.Mixed,
    },

    chapaVerifiedAt: {
      type: Date,
    },

    // If the payment failed, store why
    failureReason: {
      type: String,
      trim: true,
    },

    // If a refund was issued
    refundedAmount: {
      type: Number,
      min: 0,
    },

    refundedAt: {
      type: Date,
    },

    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Critical for the Chapa verify webhook — must find the payment
// record quickly by its tx_ref
paymentSchema.index({ chapaTxRef: 1 });

// Speeds up looking up all payments for a specific booking
paymentSchema.index({ booking: 1 });

// Speeds up filtering payments by status (admin dashboard)
paymentSchema.index({ status: 1 });

// Speeds up looking up all payments for a specific guest
paymentSchema.index({ guest: 1 });

// ── Virtual: Formatted Amount ─────────────────────────────────
paymentSchema.virtual('formattedAmount').get(function (this: IPayment) {
  return `${this.currency} ${this.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// ── Virtual: Is Successful ────────────────────────────────────
paymentSchema.virtual('isSuccessful').get(function (this: IPayment) {
  return this.status === 'success';
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Payment: Model<IPayment> = model<IPayment>(
  'Payment',
  paymentSchema
);

export default Payment;
