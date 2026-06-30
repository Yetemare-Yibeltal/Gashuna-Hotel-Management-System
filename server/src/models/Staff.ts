// server/src/models/Staff.ts
// ─────────────────────────────────────────────────────────────
// STAFF MODEL — Gashuna Hotel Management System
//
// Represents every employee working at Gashuna Hotel —
// this is the full HR record, separate from the User model.
//
// IMPORTANT DISTINCTION:
//   User model   → login accounts (Admin, Manager, Receptionist)
//                  used to access the admin dashboard
//   Staff model  → HR records for ALL employees including
//                  housekeeping, kitchen, security, maintenance
//                  who do NOT need login access
//
// A staff member CAN optionally be linked to a User account
// if they need dashboard access (e.g. the Front Desk Manager
// is both a Staff record AND has a User login account)
//
// Departments:
//   front_desk    — reception and guest services
//   housekeeping  — room cleaning and maintenance
//   restaurant    — waiters, restaurant service staff
//   kitchen       — chefs and kitchen staff
//   maintenance   — building and equipment repairs
//   security      — hotel security guards
//   management    — hotel management team
//   accounting    — finance and accounting staff
//
// Shifts:
//   morning   — typically 6am-2pm
//   afternoon — typically 2pm-10pm
//   night     — typically 10pm-6am
//   rotating  — shift changes weekly
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type StaffDepartment =
  | 'front_desk'
  | 'housekeeping'
  | 'restaurant'
  | 'kitchen'
  | 'maintenance'
  | 'security'
  | 'management'
  | 'accounting';

export type StaffShift = 'morning' | 'afternoon' | 'night' | 'rotating';

export type StaffStatus = 'active' | 'on_leave' | 'terminated';

// ── Staff Document Interface ──────────────────────────────────
export interface IStaff extends Document {
  fullName: string;
  position: string;
  department: StaffDepartment;
  phone: string;
  email?: string;
  salary: number;
  hireDate: Date;
  terminationDate?: Date;
  shift: StaffShift;
  status: StaffStatus;
  photo?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankAccountNumber?: string;
  bankName?: string;
  linkedUserAccount?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Staff Schema ───────────────────────────────────────────────
const staffSchema = new Schema<IStaff>(
  {
    fullName: {
      type: String,
      required: [true, 'Staff full name is required'],
      trim: true,
    },

    position: {
      type: String,
      required: [true, 'Job position is required'],
      trim: true,
    },

    department: {
      type: String,
      enum: {
        values: [
          'front_desk',
          'housekeeping',
          'restaurant',
          'kitchen',
          'maintenance',
          'security',
          'management',
          'accounting',
        ],
        message: '{VALUE} is not a valid department',
      },
      required: [true, 'Department is required'],
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Monthly salary in Ethiopian Birr
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },

    hireDate: {
      type: Date,
      required: [true, 'Hire date is required'],
    },

    // Set when an employee leaves the hotel
    terminationDate: {
      type: Date,
    },

    shift: {
      type: String,
      enum: {
        values: ['morning', 'afternoon', 'night', 'rotating'],
        message: '{VALUE} is not a valid shift',
      },
      default: 'morning',
    },

    status: {
      type: String,
      enum: {
        values: ['active', 'on_leave', 'terminated'],
        message: '{VALUE} is not a valid staff status',
      },
      default: 'active',
    },

    photo: {
      type: String,
      default: '',
    },

    address: {
      type: String,
      trim: true,
    },

    // Emergency contact details — required for HR compliance
    emergencyContactName: {
      type: String,
      trim: true,
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
    },

    // Bank details for salary payment via bank transfer
    bankAccountNumber: {
      type: String,
      trim: true,
    },

    bankName: {
      type: String,
      trim: true,
    },

    // Optional link to a User login account
    // Only set for staff who need dashboard access
    linkedUserAccount: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
staffSchema.index({ department: 1 });
staffSchema.index({ status: 1 });

// ── Virtual: Formatted Salary ─────────────────────────────────
staffSchema.virtual('formattedSalary').get(function (this: IStaff) {
  return `ETB ${this.salary.toLocaleString('en-US')}`;
});

// ── Virtual: Years of Service ─────────────────────────────────
// Calculates how many years the employee has worked at the hotel
staffSchema.virtual('yearsOfService').get(function (this: IStaff) {
  const endDate = this.terminationDate || new Date();
  const years =
    (endDate.getTime() - this.hireDate.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years * 10) / 10; // round to 1 decimal place
});

staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Staff: Model<IStaff> = model<IStaff>('Staff', staffSchema);

export default Staff;
