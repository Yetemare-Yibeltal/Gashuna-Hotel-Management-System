// server/src/models/Notification.ts
// ─────────────────────────────────────────────────────────────
// NOTIFICATION MODEL — Gashuna Hotel Management System
//
// Stores system alerts and notifications shown in the admin
// dashboard notification bell and alerts panel.
//
// Notifications are created automatically by the system when
// important events occur, for example:
//   NEW_BOOKING        → a guest just made an online booking
//   BOOKING_CONFIRMED  → a booking was confirmed by staff
//   CHECKIN_DUE        → a guest is due to check in today
//   CHECKOUT_DUE       → a guest is due to check out today
//   PAYMENT_RECEIVED   → a payment was successfully processed
//   PAYMENT_FAILED     → a Chapa payment failed
//   LOW_STOCK          → an inventory item is below reorder level
//   HOUSEKEEPING_DONE  → a room cleaning task is completed
//   MAINTENANCE_OPEN   → a new maintenance issue was reported
//   MAINTENANCE_URGENT → a critical maintenance issue needs attention
//   VIP_ARRIVAL        → a VIP guest is arriving today
//   ROOM_AVAILABLE     → a room has been cleaned and is now available
//   INVOICE_OVERDUE    → an invoice payment is overdue
//   STAFF_ABSENT       → a staff member did not clock in
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationEvent =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'CHECKIN_DUE'
  | 'CHECKOUT_DUE'
  | 'CHECKIN_COMPLETED'
  | 'CHECKOUT_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'LOW_STOCK'
  | 'HOUSEKEEPING_DONE'
  | 'HOUSEKEEPING_OVERDUE'
  | 'MAINTENANCE_OPEN'
  | 'MAINTENANCE_URGENT'
  | 'MAINTENANCE_RESOLVED'
  | 'VIP_ARRIVAL'
  | 'ROOM_AVAILABLE'
  | 'INVOICE_OVERDUE'
  | 'STAFF_ABSENT'
  | 'GENERAL';

// ── Notification Document Interface ──────────────────────────
export interface INotification extends Document {
  recipient: Types.ObjectId;
  type: NotificationType;
  event: NotificationEvent;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  link?: string;
  relatedBooking?: Types.ObjectId;
  relatedRoom?: Types.ObjectId;
  relatedGuest?: Types.ObjectId;
  relatedStaff?: Types.ObjectId;
  relatedPayment?: Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Static Methods Interface ──────────────────────────────────
// Declares the createNotification static method
// so TypeScript knows it exists on the Model
export interface INotificationModel extends Model<INotification> {
  createNotification(
    data: Partial<INotification>
  ): Promise<INotification>;
}

// ── Notification Schema ────────────────────────────────────────
const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
    },

    type: {
      type: String,
      enum: {
        values: ['info', 'success', 'warning', 'error'],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'info',
    },

    event: {
      type: String,
      enum: {
        values: [
          'NEW_BOOKING',
          'BOOKING_CONFIRMED',
          'BOOKING_CANCELLED',
          'CHECKIN_DUE',
          'CHECKOUT_DUE',
          'CHECKIN_COMPLETED',
          'CHECKOUT_COMPLETED',
          'PAYMENT_RECEIVED',
          'PAYMENT_FAILED',
          'LOW_STOCK',
          'HOUSEKEEPING_DONE',
          'HOUSEKEEPING_OVERDUE',
          'MAINTENANCE_OPEN',
          'MAINTENANCE_URGENT',
          'MAINTENANCE_RESOLVED',
          'VIP_ARRIVAL',
          'ROOM_AVAILABLE',
          'INVOICE_OVERDUE',
          'STAFF_ABSENT',
          'GENERAL',
        ],
        message: '{VALUE} is not a valid notification event',
      },
      default: 'GENERAL',
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    link: {
      type: String,
      trim: true,
    },

    relatedBooking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    relatedRoom: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },

    relatedGuest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },

    relatedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },

    relatedPayment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },

    // TTL — notifications auto-delete after 30 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Virtual: Time Ago ─────────────────────────────────────────
notificationSchema.virtual('timeAgo').get(function (
  this: INotification
) {
  const now = Date.now();
  const diff = now - this.createdAt.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// ── Static Method: createNotification ────────────────────────
notificationSchema.statics.createNotification = async function (
  data: Partial<INotification>
): Promise<INotification> {
  return this.create(data);
};

// ── Create and Export Model ───────────────────────────────────
// We use INotificationModel so TypeScript knows about
// the createNotification static method
const Notification = model<INotification, INotificationModel>(
  'Notification',
  notificationSchema
);

export default Notification;
