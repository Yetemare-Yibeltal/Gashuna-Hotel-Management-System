// server/src/models/Room.ts
// ─────────────────────────────────────────────────────────────
// ROOM MODEL — Gashuna Hotel Management System
//
// Represents every physical room in the hotel.
// This is the core inventory table used by:
//   - Public website room listing and booking
//   - Admin room management dashboard
//   - Housekeeping status board
//   - Reports and occupancy analytics
//
// Room types at Gashuna Hotel:
//   standard      — basic comfortable rooms
//   deluxe        — upgraded rooms with better views
//   junior_suite  — larger rooms with separate living area
//   suite         — presidential suite, top tier luxury
//
// Room status values:
//   available     — ready to be booked
//   occupied      — guest is currently staying
//   cleaning      — housekeeping is cleaning after checkout
//   maintenance    — room is under repair, cannot be booked
//   reserved      — booked but guest has not checked in yet
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type RoomType = 'standard' | 'deluxe' | 'junior_suite' | 'suite';
export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'reserved';

// ── Room Document Interface ───────────────────────────────────
export interface IRoom extends Document {
  roomNumber: string;
  type: RoomType;
  name: string;
  nameAmharic?: string;
  floor: number;
  view: string;
  size: number;
  price: number;
  capacity: number;
  beds: string;
  status: RoomStatus;
  amenities: string[];
  description: string;
  images: string[];
  model3D?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Room Schema ────────────────────────────────────────────────
const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: ['standard', 'deluxe', 'junior_suite', 'suite'],
        message: '{VALUE} is not a valid room type',
      },
      required: [true, 'Room type is required'],
    },

    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },

    nameAmharic: {
      type: String,
      trim: true,
    },

    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor cannot be negative'],
    },

    view: {
      type: String,
      required: [true, 'View description is required'],
      trim: true,
    },

    size: {
      type: Number,
      required: [true, 'Room size is required'],
      min: [1, 'Room size must be at least 1 square meter'],
    },

    price: {
      type: Number,
      required: [true, 'Room price is required'],
      min: [0, 'Price cannot be negative'],
    },

    capacity: {
      type: Number,
      required: [true, 'Guest capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
    },

    beds: {
      type: String,
      required: [true, 'Bed configuration is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: [
          'available',
          'occupied',
          'cleaning',
          'maintenance',
          'reserved',
        ],
        message: '{VALUE} is not a valid room status',
      },
      default: 'available',
    },

    amenities: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    // Path to a .glb or .gltf 3D model file
    // Used for the interactive 3D room viewer on the website
    model3D: {
      type: String,
      default: '',
    },

    // Soft delete flag — inactive rooms are hidden but not deleted
    // Used when a room is permanently taken out of service
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
// Speeds up the most common queries:
// filtering rooms by type and status together
roomSchema.index({ type: 1, status: 1 });

// Speeds up sorting and filtering by price
roomSchema.index({ price: 1 });

// ── Virtual: Formatted Price ──────────────────────────────────
// Computed field — not stored in database, calculated on the fly
// Example: 1800 → 'ETB 1,800.00'
roomSchema.virtual('formattedPrice').get(function (this: IRoom) {
  return `ETB ${this.price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// Include virtuals when converting document to JSON
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Room: Model<IRoom> = model<IRoom>('Room', roomSchema);

export default Room;
