// server/src/models/MenuItem.ts
// ─────────────────────────────────────────────────────────────
// MENU ITEM MODEL — Gashuna Hotel Management System
//
// Represents every dish on the Gashuna Hotel restaurant menu.
// Includes authentic Ethiopian cuisine with bilingual names
// (English and Amharic) to serve both local and international
// guests.
//
// Categories:
//   breakfast   — morning menu items
//   mains       — main course dishes
//   drinks      — beverages including coffee ceremony, tej
//   appetizers  — starters and small plates
//   desserts    — sweet dishes
//
// Used by:
//   - Public Restaurant page (guest-facing menu)
//   - Room service ordering
//   - Admin menu management
//   - Food order line items on invoices
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type MenuCategory =
  | 'breakfast'
  | 'mains'
  | 'drinks'
  | 'appetizers'
  | 'desserts';

// ── Menu Item Document Interface ──────────────────────────────
export interface IMenuItem extends Document {
  name: string;
  nameAmharic?: string;
  category: MenuCategory;
  description: string;
  price: number;
  isVeg: boolean;
  isSpicy: boolean;
  popular: boolean;
  available: boolean;
  image?: string;
  preparationTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Menu Item Schema ───────────────────────────────────────────
const menuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
    },

    nameAmharic: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: {
        values: ['breakfast', 'mains', 'drinks', 'appetizers', 'desserts'],
        message: '{VALUE} is not a valid menu category',
      },
      required: [true, 'Menu category is required'],
    },

    description: {
      type: String,
      required: [true, 'Dish description is required'],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Vegetarian flag — important for Ethiopian fasting dishes
    isVeg: {
      type: Boolean,
      default: false,
    },

    // Spicy flag — many Ethiopian dishes use berbere spice
    isSpicy: {
      type: Boolean,
      default: false,
    },

    // Marked as a popular/recommended dish
    popular: {
      type: Boolean,
      default: false,
    },

    // Whether this item is currently available to order
    // Can be toggled off if ingredients run out
    available: {
      type: Boolean,
      default: true,
    },

    image: {
      type: String,
      default: '',
    },

    // Estimated preparation time in minutes
    // Shown to guests ordering room service
    preparationTime: {
      type: Number,
      min: 0,
      default: 20,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up filtering the menu by category (most common query)
menuItemSchema.index({ category: 1 });

// Speeds up filtering only available items
menuItemSchema.index({ available: 1 });

// ── Virtual: Formatted Price ──────────────────────────────────
menuItemSchema.virtual('formattedPrice').get(function (
  this: IMenuItem
) {
  return `ETB ${this.price.toLocaleString('en-US')}`;
});

menuItemSchema.set('toJSON', { virtuals: true });
menuItemSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const MenuItem: Model<IMenuItem> = model<IMenuItem>(
  'MenuItem',
  menuItemSchema
);

export default MenuItem;
