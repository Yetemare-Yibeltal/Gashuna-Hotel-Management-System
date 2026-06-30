// server/src/models/Payroll.ts
// ─────────────────────────────────────────────────────────────
// PAYROLL MODEL — Gashuna Hotel Management System
//
// Represents one staff member's payroll record for one
// calendar month. Generated at the end of each month based on:
//   - Base salary (from the Staff model)
//   - Attendance deductions (absences without leave)
//   - Bonuses (performance, holiday bonus, etc.)
//   - Advances already paid during the month
//
// Net Pay Formula:
//   netPay = baseSalary + bonuses - deductions - advancesPaid
//
// Payroll status:
//   draft     — calculated but not yet approved
//   approved  — approved by management, ready to pay
//   paid      — payment has been disbursed to the employee
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type PayrollStatus = 'draft' | 'approved' | 'paid';

export type PayrollPaymentMethod = 'cash' | 'bank_transfer' | 'telebirr' | 'chapa';

// ── Payroll Document Interface ────────────────────────────────
export interface IPayroll extends Document {
  staff: Types.ObjectId;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  bonusReason?: string;
  deductions: number;
  deductionReason?: string;
  advancesPaid: number;
  netPay: number;
  daysWorked: number;
  daysAbsent: number;
  status: PayrollStatus;
  paymentMethod?: PayrollPaymentMethod;
  paidAt?: Date;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Payroll Schema ──────────────────────────────────────────────
const payrollSchema = new Schema<IPayroll>(
  {
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff member is required'],
    },

    // Month as a number 1-12
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },

    year: {
      type: Number,
      required: [true, 'Year is required'],
    },

    // Base salary for this month in ETB (copied from Staff record
    // at the time payroll is generated — protects historical
    // payroll records if salary changes later)
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: 0,
    },

    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusReason: {
      type: String,
      trim: true,
    },

    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductionReason: {
      type: String,
      trim: true,
    },

    // Salary advances already given during the month
    // These are subtracted from the final net pay
    advancesPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Calculated: baseSalary + bonuses - deductions - advancesPaid
    netPay: {
      type: Number,
      required: true,
      min: 0,
    },

    daysWorked: {
      type: Number,
      default: 0,
      min: 0,
    },

    daysAbsent: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: ['draft', 'approved', 'paid'],
        message: '{VALUE} is not a valid payroll status',
      },
      default: 'draft',
    },

    // Added 'chapa' as an option — some hotels disburse
    // salary advances or small payments via Chapa mobile transfer
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'telebirr', 'chapa'],
    },

    paidAt: {
      type: Date,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// One staff member should only have one payroll record per month
payrollSchema.index({ staff: 1, month: 1, year: 1 }, { unique: true });

// Speeds up generating payroll reports for a specific month
payrollSchema.index({ month: 1, year: 1 });

// ── Pre-Save Hook: Calculate Net Pay ──────────────────────────
// Automatically calculates netPay whenever the payroll is saved
payrollSchema.pre('save', function (next) {
  const calculated =
    this.baseSalary + this.bonuses - this.deductions - this.advancesPaid;

  // Net pay should never go below 0
  this.netPay = Math.max(0, Math.round(calculated * 100) / 100);

  next();
});

// ── Virtual: Formatted Net Pay ────────────────────────────────
payrollSchema.virtual('formattedNetPay').get(function (this: IPayroll) {
  return `ETB ${this.netPay.toLocaleString('en-US')}`;
});

// ── Virtual: Month Name ────────────────────────────────────────
// Converts the numeric month into a readable name
// Example: 6 → 'June'
payrollSchema.virtual('monthName').get(function (this: IPayroll) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return monthNames[this.month - 1];
});

payrollSchema.set('toJSON', { virtuals: true });
payrollSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Payroll: Model<IPayroll> = model<IPayroll>(
  'Payroll',
  payrollSchema
);

export default Payroll;
