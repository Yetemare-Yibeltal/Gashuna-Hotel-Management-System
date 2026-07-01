// server/src/models/Service.ts
// ─────────────────────────────────────────────────────────────
// SERVICE MODEL — Gashuna Hotel Management System
//
// Represents every paid service offered by Gashuna Hotel
// beyond the room itself. Guests can request these services
// through the concierge, website, or front desk.
//
// Service categories:
//   transport    — airport transfers, city transport
//   tour         — guided tours to Blue Nile Gorge, Lake Tana
//   laundry      — wash, dry, iron services
//   spa          — massage and wellness services
//   conference   — conference hall and meeting room rental
//   recreation   — swimming pool, gym access
//   business     — printing, scanning, business center
//   other        — any other miscellaneous services
//
// All prices are in Ethiopian Birr (ETB).
// VAT of 15% is applied at the invoice level —
// service prices stored here are pre-VAT amounts.
//
// Used by:
//   - Public Services page (guest-facing service catalog)
//   - Service request form (guests request services)
//   - Invoice line items (charges added to guest invoice)
//   - Admin service management screen
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type ServiceCategory =
  | 'transport'
  | 'tour'
  | 'laundry'
  | 'spa'
  | 'conference'
  | 'recreation'
  | 'business'
  | 'other';

// ── Service Document Interface ────────────────────────────────
export interface IService extends Document {
  name: string;
  nameAmharic?: string;
  category: ServiceCategory;
  description: string;
  price: number;
  unit: string;
  available: boolean;
  icon?: string;
  requiresBooking: boolean;
  maxCapacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Service Schema ─────────────────────────────────────────────
const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },

    // Amharic name for bilingual display on the website
    nameAmharic: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: {
        values: [
          'transport',
          'tour',
          'laundry',
          'spa',
          'conference',
          'recreation',
          'business',
          'other',
        ],
        message: '{VALUE} is not a valid service category',
      },
      required: [true, 'Service category is required'],
    },

    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },

    // Price in ETB — pre-VAT amount
    // 0 means the service is free (e.g. currency exchange, WiFi)
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },

    // The pricing unit for this service
    // Examples:
    //   'per trip'    → airport transfer (1,500 ETB per trip)
    //   'per person'  → Blue Nile tour (800 ETB per person)
    //   'per kg'      → laundry (150 ETB per kg)
    //   'per day'     → conference hall (5,000 ETB per day)
    //   'per hour'    → massage (400 ETB per hour)
    //   'free'        → currency exchange, WiFi
    unit: {
      type: String,
      required: [true, 'Pricing unit is required'],
      trim: true,
    },

    // Whether this service is currently offered
    // Can be toggled off if staff are unavailable
    available: {
      type: Boolean,
      default: true,
    },

    // Emoji or icon name for display on the website
    // Example: '✈️' for airport transfer, '🏔️' for tours
    icon: {
      type: String,
      trim: true,
    },

    // Whether advance booking is required for this service
    // true  → guest must request in advance (tours, conference hall)
    // false → can be requested anytime (laundry, currency exchange)
    requiresBooking: {
      type: Boolean,
      default: false,
    },

    // Maximum number of people/units for this service
    // Used for conference hall (max 120 guests) and tours
    maxCapacity: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up filtering services by category
serviceSchema.index({ category: 1 });

// Speeds up filtering only available services
serviceSchema.index({ available: 1 });

// ── Virtual: Formatted Price ──────────────────────────────────
serviceSchema.virtual('formattedPrice').get(function (this: IService) {
  if (this.price === 0) return 'Free';
  return `ETB ${this.price.toLocaleString('en-US')} ${this.unit}`;
});

// ── Virtual: Is Free ──────────────────────────────────────────
serviceSchema.virtual('isFree').get(function (this: IService) {
  return this.price === 0;
});

serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Service: Model<IService> = model<IService>(
  'Service',
  serviceSchema
);

export default Service;
