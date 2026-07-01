// server/src/models/ServiceRequest.ts
// ─────────────────────────────────────────────────────────────
// SERVICE REQUEST MODEL — Gashuna Hotel Management System
//
// Represents a request made by a guest for a hotel service.
// When a guest requests a service (tour, laundry, transfer),
// a ServiceRequest record is created to track it from
// submission through to completion and billing.
//
// Request status lifecycle:
//   pending    → just submitted, not yet reviewed
//   confirmed  → management has confirmed the request
//   assigned   → assigned to a specific staff member
//   in_progress → staff is actively fulfilling the request
//   completed  → service has been delivered to the guest
//   cancelled  → request was cancelled
//
// Billing flow:
//   Once a request is marked 'completed', the service charge
//   (quantity × service price) is automatically added as a
//   line item to the guest's invoice if linked to a booking.
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type ServiceRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ── Service Request Document Interface ───────────────────────
export interface IServiceRequest extends Document {
  guest: Types.ObjectId;
  booking?: Types.ObjectId;
  service: Types.ObjectId;
  quantity: number;
  totalPrice: number;
  status: ServiceRequestStatus;
  requestedFor?: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  assignedTo?: Types.ObjectId;
  notes?: string;
  guestNotes?: string;
  cancellationReason?: string;
  isCharged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Service Request Schema ────────────────────────────────────
const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required for a service request'],
    },

    // Optional link to a booking so charges can be added
    // to the guest's final invoice automatically
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },

    // How many units of this service are requested
    // Example: 3 people for a tour, 2kg for laundry
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },

    // quantity × service.price — calculated when request is created
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'assigned',
          'in_progress',
          'completed',
          'cancelled',
        ],
        message: '{VALUE} is not a valid service request status',
      },
      default: 'pending',
    },

    // When the guest wants the service to be performed
    // Example: "Tomorrow morning at 6am for airport transfer"
    requestedFor: {
      type: Date,
    },

    // When the service is actually scheduled by staff
    scheduledAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    // Which staff member is assigned to fulfill this request
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },

    // Internal notes added by staff
    notes: {
      type: String,
      trim: true,
    },

    // Notes provided by the guest when making the request
    // Example: "Please pick me up at the airport exit gate B"
    guestNotes: {
      type: String,
      trim: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    // Whether this service charge has been added to the invoice
    // Prevents double-charging the guest
    isCharged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
serviceRequestSchema.index({ guest: 1 });
serviceRequestSchema.index({ booking: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ assignedTo: 1 });

// ── Virtual: Formatted Total Price ───────────────────────────
serviceRequestSchema.virtual('formattedTotalPrice').get(function (
  this: IServiceRequest
) {
  return `ETB ${this.totalPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

serviceRequestSchema.set('toJSON', { virtuals: true });
serviceRequestSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const ServiceRequest: Model<IServiceRequest> =
  model<IServiceRequest>('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
