// server/src/models/InventoryItem.ts
// ─────────────────────────────────────────────────────────────
// INVENTORY ITEM MODEL — Gashuna Hotel Management System
//
// Represents every item tracked in the hotel's stock
// management system. Items are organized by category
// based on which department uses them.
//
// Categories:
//   kitchen      — ingredients and cooking supplies
//                  Examples: Teff flour, Berbere spice,
//                  cooking oil, meat, vegetables
//
//   housekeeping — room cleaning supplies and toiletries
//                  Examples: soap, shampoo, towels,
//                  bed sheets, cleaning products
//
//   bar          — beverages and bar supplies
//                  Examples: Tej, Tella, soft drinks,
//                  water bottles, glasses
//
//   maintenance  — tools and repair supplies
//                  Examples: light bulbs, paint, tools,
//                  spare parts
//
//   office       — office stationery and admin supplies
//                  Examples: paper, pens, printer ink
//
//   amenities    — guest room amenity items
//                  Examples: shampoo sachets, soap bars,
//                  coffee sachets, bottled water
//
// Low stock alerts:
//   When quantity falls below reorderLevel, the item
//   appears in the Low Stock Alerts panel on the admin
//   dashboard and Inventory page.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type InventoryCategory =
  | 'kitchen'
  | 'housekeeping'
  | 'bar'
  | 'maintenance'
  | 'office'
  | 'amenities';

// ── Inventory Item Document Interface ────────────────────────
export interface IInventoryItem extends Document {
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier?: string;
  supplierPhone?: string;
  location?: string;
  lastRestocked?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Inventory Item Schema ──────────────────────────────────────
const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },

    category: {
      type: String,
      enum: {
        values: [
          'kitchen',
          'housekeeping',
          'bar',
          'maintenance',
          'office',
          'amenities',
        ],
        message: '{VALUE} is not a valid inventory category',
      },
      required: [true, 'Category is required'],
    },

    // Unit of measurement
    // Examples: kg, liters, pieces, boxes, rolls, packets
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
    },

    // Current stock level in the specified unit
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },

    // When quantity falls below this level, a low stock
    // alert is shown in the admin dashboard
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      default: 5,
      min: [0, 'Reorder level cannot be negative'],
    },

    // Cost per unit in Ethiopian Birr (ETB)
    // Used to calculate total inventory value
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },

    // Name of the supplier/vendor this item is bought from
    supplier: {
      type: String,
      trim: true,
    },

    supplierPhone: {
      type: String,
      trim: true,
    },

    // Where this item is physically stored in the hotel
    // Example: "Kitchen Store Room B", "Housekeeping Closet Floor 2"
    location: {
      type: String,
      trim: true,
    },

    // When was the last time this item was restocked
    // Used to identify slow-moving inventory
    lastRestocked: {
      type: Date,
    },

    // Soft delete — inactive items are hidden but not deleted
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
// Speeds up filtering inventory by category
inventoryItemSchema.index({ category: 1 });

// Speeds up finding active items only
inventoryItemSchema.index({ isActive: 1 });

// ── Virtual: Is Low Stock ──────────────────────────────────────
// Returns true if the current quantity is at or below
// the reorder level — triggers low stock alert
inventoryItemSchema.virtual('isLowStock').get(function (
  this: IInventoryItem
) {
  return this.quantity <= this.reorderLevel;
});

// ── Virtual: Total Value ───────────────────────────────────────
// Calculates the total value of current stock in ETB
// quantity × unitCost
inventoryItemSchema.virtual('totalValue').get(function (
  this: IInventoryItem
) {
  return Math.round(this.quantity * this.unitCost * 100) / 100;
});

// ── Virtual: Formatted Total Value ────────────────────────────
inventoryItemSchema.virtual('formattedTotalValue').get(function (
  this: IInventoryItem
) {
  const total = this.quantity * this.unitCost;
  return `ETB ${total.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const InventoryItem: Model<IInventoryItem> = model<IInventoryItem>(
  'InventoryItem',
  inventoryItemSchema
);

export default InventoryItem;
