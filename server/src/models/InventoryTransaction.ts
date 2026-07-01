// server/src/models/InventoryTransaction.ts
// ─────────────────────────────────────────────────────────────
// INVENTORY TRANSACTION MODEL — Gashuna Hotel Management System
//
// Records every stock movement for every inventory item.
// Creates a complete audit trail of all stock changes over time.
//
// Transaction types:
//   stock_in    — new stock received from supplier
//                 Example: 50kg Teff flour received from
//                 Dangla Market supplier
//
//   stock_out   — stock consumed/used by a department
//                 Example: 5kg Berbere used by kitchen today
//
//   adjustment  — manual correction to fix a counting error
//                 Example: found 3 extra towels in storage
//
//   waste       — items discarded due to expiry or damage
//                 Example: 2kg vegetables expired, discarded
//
//   transfer    — moved from one storage location to another
//                 Example: moved soap bars from main store
//                 to Floor 2 housekeeping closet
//
// This model allows the system to:
//   - Show full stock history for any item
//   - Calculate average daily usage
//   - Identify departments using the most stock
//   - Reconcile physical count vs system count
//   - Generate supplier purchase history
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type TransactionType =
  | 'stock_in'
  | 'stock_out'
  | 'adjustment'
  | 'waste'
  | 'transfer';

// ── Inventory Transaction Document Interface ──────────────────
export interface IInventoryTransaction extends Document {
  inventoryItem: Types.ObjectId;
  transactionType: TransactionType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  totalCost?: number;
  department?: string;
  reason?: string;
  supplier?: string;
  invoiceRef?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Inventory Transaction Schema ──────────────────────────────
const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item is required'],
    },

    transactionType: {
      type: String,
      enum: {
        values: [
          'stock_in',
          'stock_out',
          'adjustment',
          'waste',
          'transfer',
        ],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },

    // How many units were moved in this transaction
    // Always a positive number — the type field indicates
    // whether this is an increase or decrease
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },

    // Stock level BEFORE this transaction
    // Stored for audit trail — allows recreation of full history
    quantityBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    // Stock level AFTER this transaction
    // quantityAfter = quantityBefore + quantity (for stock_in)
    // quantityAfter = quantityBefore - quantity (for stock_out/waste)
    quantityAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    // Cost per unit for this transaction in ETB
    // Only relevant for stock_in transactions (purchases)
    unitCost: {
      type: Number,
      min: 0,
    },

    // Total cost for this transaction in ETB
    // unitCost × quantity for stock_in
    totalCost: {
      type: Number,
      min: 0,
    },

    // Which department consumed the stock (for stock_out)
    // Examples: kitchen, housekeeping, bar, restaurant
    department: {
      type: String,
      trim: true,
    },

    // Why this transaction was performed
    // Examples:
    //   "Daily kitchen use", "Room preparation floor 2",
    //   "Delivery from Abebe Suppliers", "Monthly count correction"
    reason: {
      type: String,
      trim: true,
    },

    // Supplier name — only for stock_in transactions
    supplier: {
      type: String,
      trim: true,
    },

    // Supplier invoice or delivery note reference number
    // Used to match stock_in transactions to supplier invoices
    invoiceRef: {
      type: String,
      trim: true,
    },

    // Which staff member performed this transaction
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff member who performed this transaction is required'],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up fetching the full transaction history for one item
inventoryTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });

// Speeds up filtering transactions by type
inventoryTransactionSchema.index({ transactionType: 1 });

// Speeds up filtering by date range for monthly reports
inventoryTransactionSchema.index({ createdAt: -1 });

// ── Virtual: Formatted Total Cost ─────────────────────────────
inventoryTransactionSchema.virtual('formattedTotalCost').get(function (
  this: IInventoryTransaction
) {
  if (!this.totalCost) return 'N/A';
  return `ETB ${this.totalCost.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// ── Virtual: Is Stock Increase ────────────────────────────────
// Returns true if this transaction increased the stock level
inventoryTransactionSchema.virtual('isIncrease').get(function (
  this: IInventoryTransaction
) {
  return (
    this.transactionType === 'stock_in' ||
    (this.transactionType === 'adjustment' &&
      this.quantityAfter > this.quantityBefore)
  );
});

inventoryTransactionSchema.set('toJSON', { virtuals: true });
inventoryTransactionSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const InventoryTransaction: Model<IInventoryTransaction> =
  model<IInventoryTransaction>(
    'InventoryTransaction',
    inventoryTransactionSchema
  );

export default InventoryTransaction;
