// server/src/models/AuditLog.ts
// ─────────────────────────────────────────────────────────────
// AUDIT LOG MODEL — Gashuna Hotel Management System
//
// Records every important action performed by any admin user
// in the system. Creates a permanent, tamper-evident trail
// of who did what and when.
//
// Why audit logging matters for a hotel:
//   - A guest disputes a charge → check who created the invoice
//   - Money is missing → trace every payment record change
//   - A booking was deleted → find out who deleted it and when
//   - Room price was changed → see who changed it and to what
//   - A staff account was deactivated → trace who did it
//
// Actions logged:
//   CREATE   → a new record was created
//   UPDATE   → an existing record was modified
//   DELETE   → a record was deleted
//   LOGIN    → a user logged into the admin dashboard
//   LOGOUT   → a user logged out
//   CHECKIN  → a guest was checked in to a room
//   CHECKOUT → a guest was checked out from a room
//   PAYMENT  → a payment was recorded or updated
//   EXPORT   → a report or data was exported
//   SETTINGS → system settings were changed
//
// Resources tracked (which type of record was affected):
//   User, Room, Guest, Booking, Invoice, Payment,
//   Staff, Payroll, Inventory, Service, Settings
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'PAYMENT'
  | 'EXPORT'
  | 'SETTINGS';

export type AuditResource =
  | 'User'
  | 'Room'
  | 'Guest'
  | 'Booking'
  | 'Invoice'
  | 'Payment'
  | 'Staff'
  | 'Attendance'
  | 'Payroll'
  | 'Inventory'
  | 'Service'
  | 'ServiceRequest'
  | 'HousekeepingTask'
  | 'MaintenanceRequest'
  | 'Notification'
  | 'Settings'
  | 'Report';

// ── Audit Log Document Interface ──────────────────────────────
export interface IAuditLog extends Document {
  user: Types.ObjectId;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Audit Log Schema ───────────────────────────────────────────
const auditLogSchema = new Schema<IAuditLog>(
  {
    // Who performed the action
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for audit log'],
    },

    // Store name and role at time of action
    // (in case the user record is later deleted or changed)
    userName: {
      type: String,
      required: true,
    },

    userRole: {
      type: String,
      required: true,
    },

    // What type of action was performed
    action: {
      type: String,
      enum: {
        values: [
          'CREATE',
          'UPDATE',
          'DELETE',
          'LOGIN',
          'LOGOUT',
          'CHECKIN',
          'CHECKOUT',
          'PAYMENT',
          'EXPORT',
          'SETTINGS',
        ],
        message: '{VALUE} is not a valid audit action',
      },
      required: [true, 'Action is required'],
    },

    // Which type of record was affected
    resource: {
      type: String,
      enum: {
        values: [
          'User',
          'Room',
          'Guest',
          'Booking',
          'Invoice',
          'Payment',
          'Staff',
          'Attendance',
          'Payroll',
          'Inventory',
          'Service',
          'ServiceRequest',
          'HousekeepingTask',
          'MaintenanceRequest',
          'Notification',
          'Settings',
          'Report',
        ],
        message: '{VALUE} is not a valid audit resource',
      },
      required: [true, 'Resource type is required'],
    },

    // The MongoDB _id of the specific record that was affected
    // Example: the booking ID that was cancelled
    resourceId: {
      type: String,
    },

    // Human-readable description of what happened
    // Example: "Receptionist Selamawit checked in guest
    //           Abebe Girma to Room 201 (Tana Deluxe)"
    description: {
      type: String,
      required: [true, 'Audit description is required'],
      trim: true,
    },

    // Snapshot of the record's data BEFORE the change
    // Only stored for UPDATE and DELETE actions
    // Allows reconstruction of what the data looked like before
    previousData: {
      type: Schema.Types.Mixed,
    },

    // Snapshot of the record's data AFTER the change
    // Only stored for CREATE and UPDATE actions
    newData: {
      type: Schema.Types.Mixed,
    },

    // IP address of the device that made the request
    // Used to detect suspicious activity from unusual locations
    ipAddress: {
      type: String,
      trim: true,
    },

    // Browser and device information
    userAgent: {
      type: String,
      trim: true,
    },

    // Whether the action completed successfully
    // false if the action was attempted but failed
    success: {
      type: Boolean,
      default: true,
    },

    // If success is false, what error occurred
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up filtering audit logs by user (who did this?)
auditLogSchema.index({ user: 1, createdAt: -1 });

// Speeds up filtering by action type
auditLogSchema.index({ action: 1 });

// Speeds up filtering by resource type and specific record
auditLogSchema.index({ resource: 1, resourceId: 1 });

// Speeds up date range queries (show logs from last 7 days)
auditLogSchema.index({ createdAt: -1 });

// ── Virtual: Formatted Date ───────────────────────────────────
auditLogSchema.virtual('formattedDate').get(function (
  this: IAuditLog
) {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

// ── Static Method: Log Action ─────────────────────────────────
// Helper used throughout controllers to quickly log an action
// Usage:
//   await AuditLog.logAction({
//     user: req.user._id,
//     userName: req.user.name,
//     userRole: req.user.role,
//     action: 'CREATE',
//     resource: 'Booking',
//     resourceId: booking._id.toString(),
//     description: `New booking ${booking.bookingRef} created`,
//     newData: booking.toObject(),
//     ipAddress: req.ip,
//   });
auditLogSchema.statics.logAction = async function (
  data: Partial<IAuditLog>
): Promise<void> {
  try {
    await this.create(data);
  } catch (error) {
    // Audit logging should never crash the main request
    // Log the error but do not throw it
    console.error('❌ Failed to create audit log:', error);
  }
};

// ── Create and Export Model ───────────────────────────────────
const AuditLog: Model<IAuditLog> = model<IAuditLog>(
  'AuditLog',
  auditLogSchema
);

export default AuditLog;
