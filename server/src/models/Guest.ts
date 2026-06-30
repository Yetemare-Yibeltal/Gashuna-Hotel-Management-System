// server/src/models/Guest.ts
// ─────────────────────────────────────────────────────────────
// GUEST MODEL — Gashuna Hotel Management System
//
// Represents every guest who has booked, stayed, or contacted
// Gashuna Hotel. This is the central CRM (Customer Relationship
// Management) record used across:
//   - Online booking (auto-created when a new guest books)
//   - Front desk check-in/check-out
//   - Guest CRM dashboard
//   - Loyalty points program
//   - Marketing and guest communication
//
// Ethiopian ID types supported:
//   kebele_id        — local Ethiopian Kebele identification card
//   passport         — for international guests
//   driving_license  — Ethiopian driver's license
//   national_id      — new Ethiopian Fayda national ID
//
// When a guest books online, the system searches for an
// existing guest record by phone number first. If found, it
// links the new booking to the existing guest profile instead
// of creating a duplicate.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type IdType =
  | 'kebele_id'
  | 'passport'
  | 'driving_license'
  | 'national_id';

// ── Guest Document Interface ──────────────────────────────────
export interface IGuest extends Document {
  fullName: string;
  email?: string;
  phone: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  vip: boolean;
  notes?: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Guest Schema ───────────────────────────────────────────────
const guestSchema = new Schema<IGuest>(
  {
    fullName: {
      type: String,
      required: [true, 'Guest full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      // Email is optional but if provided must be valid format
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    nationality: {
      type: String,
      default: 'Ethiopia',
      trim: true,
    },

    idType: {
      type: String,
      enum: {
        values: ['kebele_id', 'passport', 'driving_license', 'national_id'],
        message: '{VALUE} is not a valid ID type',
      },
      default: 'kebele_id',
    },

    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ['male', 'female'],
    },

    // ── Loyalty Program Fields ──────────────────────────────────
    // Guests earn 1 point per 100 ETB spent
    // Points can be redeemed for discounts on future stays
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, 'Loyalty points cannot be negative'],
    },

    // Total number of completed stays — incremented at checkout
    totalStays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total amount spent across all stays in ETB
    // Used for VIP qualification and reporting
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // VIP status — can be set manually by management
    // or automatically when totalSpent exceeds a threshold
    vip: {
      type: Boolean,
      default: false,
    },

    // Internal staff notes about this guest
    // Example: "Prefers quiet rooms away from elevator"
    notes: {
      type: String,
      trim: true,
    },

    profilePhoto: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Text index allows searching guests by name, phone, or email
// Used in the Guest CRM search bar
guestSchema.index({
  fullName: 'text',
  phone: 'text',
  email: 'text',
});

// Phone is the primary lookup field when matching bookings
// to existing guests — must be fast to search
guestSchema.index({ phone: 1 });

// ── Pre-Save Hook: Auto VIP Status ────────────────────────────
// Automatically upgrades a guest to VIP status if they have
// spent more than 50,000 ETB total across all their stays
const VIP_SPENDING_THRESHOLD = 50000;

guestSchema.pre('save', function (next) {
  if (this.totalSpent >= VIP_SPENDING_THRESHOLD && !this.vip) {
    this.vip = true;
  }
  next();
});

// ── Instance Method: Add Loyalty Points ───────────────────────
// Called after checkout to award points based on amount spent
// Rule: 1 loyalty point per 100 ETB spent
guestSchema.methods.addLoyaltyPoints = function (
  amountSpent: number
): void {
  const pointsEarned = Math.floor(amountSpent / 100);
  this.loyaltyPoints += pointsEarned;
  this.totalSpent += amountSpent;
  this.totalStays += 1;
};

// ── Create and Export Model ───────────────────────────────────
const Guest: Model<IGuest> = model<IGuest>('Guest', guestSchema);

export default Guest;
