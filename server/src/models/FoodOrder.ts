// server/src/models/FoodOrder.ts
// ─────────────────────────────────────────────────────────────
// FOOD ORDER MODEL — Gashuna Hotel Management System
//
// Represents an order placed by a guest — either room service
// or dining in the restaurant. Tracks the order through the
// kitchen workflow from order placement to delivery.
//
// Order types:
//   room_service — delivered to the guest's room
//   restaurant   — guest is dining in the restaurant
//
// Order status lifecycle:
//   pending    → order just placed, kitchen not yet started
//   preparing  → kitchen is cooking the order
//   ready      → food is ready, waiting for delivery/pickup
//   delivered  → order has been delivered to guest
//   cancelled  → order was cancelled
//
// When delivered, the order total can be automatically added
// as a line item to the guest's invoice if linked to a booking.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type OrderType = 'room_service' | 'restaurant';

export type FoodOrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

// ── Order Item Interface ──────────────────────────────────────
// Each food order can contain multiple menu items
export interface IFoodOrderItem {
  menuItem: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  specialInstructions?: string;
}

// ── Food Order Document Interface ─────────────────────────────
export interface IFoodOrder extends Document {
  orderNumber: string;
  booking?: Types.ObjectId;
  guest?: Types.ObjectId;
  roomNumber?: string;
  tableNumber?: string;
  orderType: OrderType;
  items: IFoodOrderItem[];
  subtotal: number;
  total: number;
  status: FoodOrderStatus;
  orderedAt: Date;
  preparedAt?: Date;
  deliveredAt?: Date;
  servedBy?: Types.ObjectId;
  notes?: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Order Item Sub-Schema ──────────────────────────────────────
const foodOrderItemSchema = new Schema<IFoodOrderItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu item reference is required'],
    },

    // Store the name at time of order — protects against
    // menu price/name changes affecting old order history
    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    specialInstructions: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// ── Food Order Schema ──────────────────────────────────────────
const foodOrderSchema = new Schema<IFoodOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
    },

    // Optional link to a booking — used for room service
    // so the charge can be added to the guest's final invoice
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },

    // For room service orders
    roomNumber: {
      type: String,
      trim: true,
    },

    // For restaurant dine-in orders
    tableNumber: {
      type: String,
      trim: true,
    },

    orderType: {
      type: String,
      enum: {
        values: ['room_service', 'restaurant'],
        message: '{VALUE} is not a valid order type',
      },
      required: [true, 'Order type is required'],
    },

    items: {
      type: [foodOrderItemSchema],
      required: true,
      validate: {
        validator: (items: IFoodOrderItem[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'pending',
    },

    orderedAt: {
      type: Date,
      default: Date.now,
    },

    preparedAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    // Which staff member delivered/served this order
    servedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    notes: {
      type: String,
      trim: true,
    },

    // Whether this order has been added to an invoice yet
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
foodOrderSchema.index({ status: 1 });
foodOrderSchema.index({ booking: 1 });
foodOrderSchema.index({ orderType: 1 });

// ── Pre-Save Hook: Calculate Totals ───────────────────────────
foodOrderSchema.pre('save', function (next) {
  // Calculate total for each item
  this.items.forEach((item) => {
    item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
  });

  // Sum all items to get the subtotal
  this.subtotal =
    Math.round(
      this.items.reduce((sum, item) => sum + item.total, 0) * 100
    ) / 100;

  // For food orders, total equals subtotal
  // (VAT is applied later at the invoice level, not per-order)
  this.total = this.subtotal;

  next();
});

// ── Create and Export Model ───────────────────────────────────
const FoodOrder: Model<IFoodOrder> = model<IFoodOrder>(
  'FoodOrder',
  foodOrderSchema
);

export default FoodOrder;
