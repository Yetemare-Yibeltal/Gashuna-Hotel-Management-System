// server/src/models/Attendance.ts
// ─────────────────────────────────────────────────────────────
// ATTENDANCE MODEL — Gashuna Hotel Management System
//
// Records daily clock-in and clock-out times for every staff
// member at Gashuna Hotel. One attendance record is created
// per staff member per day.
//
// This data feeds into:
//   - Monthly payroll calculation (absences affect pay)
//   - Staff performance reports
//   - Shift coverage analysis
//
// Attendance status:
//   present  — staff clocked in and worked their shift
//   absent   — staff did not show up, no clock-in recorded
//   late     — staff clocked in after their shift start time
//   half_day — staff worked less than half their expected shift
//   on_leave — approved leave (sick, vacation, etc.)
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave';

// ── Attendance Document Interface ─────────────────────────────
export interface IAttendance extends Document {
  staff: Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  hoursWorked: number;
  status: AttendanceStatus;
  isLate: boolean;
  lateByMinutes: number;
  notes?: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Attendance Schema ──────────────────────────────────────────
const attendanceSchema = new Schema<IAttendance>(
  {
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff member is required'],
    },

    // The calendar date this attendance record is for
    // Stored with time set to midnight for consistent querying
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    clockIn: {
      type: Date,
    },

    clockOut: {
      type: Date,
    },

    // Calculated automatically from clockIn and clockOut
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late', 'half_day', 'on_leave'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'present',
    },

    isLate: {
      type: Boolean,
      default: false,
    },

    // How many minutes late the staff member clocked in
    lateByMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Which manager approved this attendance record
    // (used for on_leave status approvals)
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
// One staff member should only have one attendance record per day
// This compound unique index enforces that rule at the database level
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

// Speeds up monthly payroll queries that filter by date range
attendanceSchema.index({ date: 1 });

// ── Pre-Save Hook: Calculate Hours Worked ─────────────────────
// Automatically calculates hoursWorked whenever clockIn
// and clockOut are both set
attendanceSchema.pre('save', function (next) {
  if (this.clockIn && this.clockOut) {
    const diffMs = this.clockOut.getTime() - this.clockIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Round to 2 decimal places
    this.hoursWorked = Math.round(diffHours * 100) / 100;

    // Flag as half day if worked less than 4 hours
    if (this.hoursWorked < 4 && this.hoursWorked > 0) {
      this.status = 'half_day';
    }
  }

  next();
});

// ── Create and Export Model ───────────────────────────────────
const Attendance: Model<IAttendance> = model<IAttendance>(
  'Attendance',
  attendanceSchema
);

export default Attendance;
