// server/src/models/RoomType.ts
// ─────────────────────────────────────────────────────────────
// ROOM TYPE MODEL — Gashuna Hotel Management System
//
// Stores the configuration and marketing content for each
// category of room at Gashuna Hotel.
//
// While the Room model stores individual room details
// (room number, floor, current status, specific price),
// this RoomType model stores the CATEGORY configuration:
//   - Rich marketing description for the website
//   - Standard amenities included in this room type
//   - Base price range (min and max)
//   - Maximum capacity for this type
//   - Feature highlights shown on the website
//   - Display order on the rooms listing page
//
// The 4 room types at Gashuna Hotel:
//
// 1. STANDARD
//    Ethiopian name: መደብ ክፍል
//    Price range: ETB 1,600 - 1,800 per night
//    Capacity: up to 2 guests
//    Description: Comfortable rooms with garden or
//    courtyard views, named after landmarks of the
//    Amhara region.
//
// 2. DELUXE
//    Ethiopian name: ድሉክስ ክፍል
//    Price range: ETB 2,600 - 2,800 per night
//    Capacity: up to 2 guests
//    Description: Upgraded rooms with stunning mountain
//    views of the Gojjam highlands. Named after the
//    great natural wonders of the region.
//
// 3. JUNIOR SUITE
//    Ethiopian name: ጁኒየር ሱይት
//    Price range: ETB 4,000 - 4,200 per night
//    Capacity: up to 3 guests
//    Description: Spacious suites with separate living
//    area. Named after the Awi Zone administrative areas.
//
// 4. SUITE (Presidential)
//    Ethiopian name: ፕሬዚዳንታዊ ሱይት
//    Price range: ETB 7,000 - 7,500 per night
//    Capacity: up to 4 guests
//    Description: The pinnacle of luxury at Gashuna Hotel.
//    360° panoramic views of Dangla and the Gojjam mountains.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type RoomTypeSlug =
  | 'standard'
  | 'deluxe'
  | 'junior_suite'
  | 'suite';

// ── Room Type Document Interface ──────────────────────────────
export interface IRoomType extends Document {
  slug: RoomTypeSlug;
  name: string;
  nameAmharic: string;
  tagline: string;
  description: string;
  highlights: string[];
  standardAmenities: string[];
  minPrice: number;
  maxPrice: number;
  maxCapacity: number;
  recommendedFor: string[];
  coverImage?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Room Type Schema ───────────────────────────────────────────
const roomTypeSchema = new Schema<IRoomType>(
  {
    // Unique slug that matches the type field in the Room model
    slug: {
      type: String,
      enum: {
        values: ['standard', 'deluxe', 'junior_suite', 'suite'],
        message: '{VALUE} is not a valid room type slug',
      },
      required: [true, 'Room type slug is required'],
      unique: true,
    },

    // Display name in English
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
    },

    // Display name in Amharic
    nameAmharic: {
      type: String,
      required: [true, 'Amharic name is required'],
      trim: true,
    },

    // Short marketing tagline shown under the room type name
    // Example: "Comfort meets Ethiopian warmth"
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
    },

    // Full rich description used on the website room type page
    // Tells the story of the room type and what makes it special
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    // 3-5 bullet point highlights shown on the website
    // Example: ["King bed with premium linen", "Mountain view balcony"]
    highlights: {
      type: [String],
      default: [],
    },

    // List of amenities that come standard with ALL rooms
    // of this type — shown on the room listing page
    standardAmenities: {
      type: [String],
      default: [],
    },

    // Minimum nightly rate for this room type in ETB
    minPrice: {
      type: Number,
      required: [true, 'Minimum price is required'],
      min: 0,
    },

    // Maximum nightly rate for this room type in ETB
    // (some rooms of the same type may be priced slightly higher
    // due to better floor or view)
    maxPrice: {
      type: Number,
      required: [true, 'Maximum price is required'],
      min: 0,
    },

    // Maximum number of guests allowed in this room type
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: 1,
    },

    // Who this room type is best suited for
    // Example: ["Business travelers", "Couples", "Families with children"]
    recommendedFor: {
      type: [String],
      default: [],
    },

    // Hero image for this room type shown on the website
    coverImage: {
      type: String,
      default: '',
    },

    // Order in which room types are displayed on the website
    // 1 = shown first (standard), 4 = shown last (suite)
    displayOrder: {
      type: Number,
      default: 1,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up looking up a room type by its slug
// (used frequently when loading room type details)
roomTypeSchema.index({ slug: 1 });

// Speeds up sorting room types by display order on the website
roomTypeSchema.index({ displayOrder: 1 });

// ── Virtual: Price Range Display ──────────────────────────────
// Returns a formatted price range string for the website
// Example: "ETB 1,600 — ETB 1,800"
roomTypeSchema.virtual('priceRange').get(function (this: IRoomType) {
  const min = this.minPrice.toLocaleString('en-US');
  const max = this.maxPrice.toLocaleString('en-US');

  if (this.minPrice === this.maxPrice) {
    return `ETB ${min}`;
  }

  return `ETB ${min} — ETB ${max}`;
});

// ── Virtual: Starting Price Display ───────────────────────────
// Returns "From ETB X,XXX per night" string for room cards
roomTypeSchema.virtual('startingPrice').get(function (this: IRoomType) {
  return `From ETB ${this.minPrice.toLocaleString('en-US')} per night`;
});

roomTypeSchema.set('toJSON', { virtuals: true });
roomTypeSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const RoomType: Model<IRoomType> = model<IRoomType>(
  'RoomType',
  roomTypeSchema
);

export default RoomType;
