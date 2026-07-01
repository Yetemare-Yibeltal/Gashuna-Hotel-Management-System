// server/src/models/MaintenanceRequest.ts
// ─────────────────────────────────────────────────────────────
// MAINTENANCE REQUEST MODEL — Gashuna Hotel Management System
//
// Tracks all maintenance issues reported at Gashuna Hotel.
// Ensures every reported problem is recorded, assigned,
// tracked, and resolved — nothing gets lost or forgotten.
//
// Who creates maintenance requests:
//   - Housekeeping staff during room cleaning
//   - Front desk staff when a guest reports a problem
//   - Maintenance supervisor during routine inspections
//   - Any admin/manager user through the admin dashboard
//
// Issue categories:
//   electrical    — lights, sockets, switches, wiring
//   plumbing      — taps, showers, toilets, water heater
//   hvac          — air conditioning, heating, ventilation
//   furniture     — beds, chairs, tables, wardrobes
//   appliances    — TV, fridge, kettle, hairdryer
//   structural    — walls, ceiling, floor, doors, windows
//   exterior      — parking, garden, signage, exterior walls
//   other         — anything not in the above categories
//
// Priority levels:
//   low      — cosmetic issue, not affecting guest comfort
//              Example: a small paint scratch on the wall
//   normal   — should be fixed within 24 hours
//              Example: a loose door handle
//   high     — should be fixed within a few hours
//              Example: AC not working in occupied room
//   critical — must be fixed immediately, room unusable
//              Example: water leak flooding the bathroom
//
// Status lifecycle:
//   open        → just reported, not yet assigned
//   assigned    → assigned to a maintenance technician
//   in_progress → technician is actively working on the fix
//   resolved    → issue has been fixed
//   closed      → verified and closed by supervisor
//   cancelled   → request was invalid or duplicate
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type MaintenanceCategory =
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'furniture'
  | 'appliances'
  | 'structural'
  | 'exterior'
  | 'other';

export type MaintenancePriority = 'low' | 'normal' | 'high' | 'critical';

export type MaintenanceStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'cancelled';

// ── Maintenance Request Document Interface ────────────────────
export interface IMaintenanceRequest extends Document {
  requestNumber: string;
  room?: Types.ObjectId;
  location: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description: string;
  reportedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedAt?: Date;
  startedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionNotes?: string;
  repairCost?: number;
  partsUsed?: string;
  requiresRoomClosure: boolean;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Maintenance Request Schema ─────────────────────────────────
const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    // Auto-generated request number for tracking
    // Format: MNT-2025-00001
    requestNumber: {
      type: String,
      required: [true, 'Request number is required'],
      unique: true,
    },

    // The room the issue is in (if applicable)
    // Some issues may be in common areas (lobby, restaurant)
    // so room is optional
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },

    // Human-readable location description
    // Example: "Room 201", "Restaurant Kitchen", "Lobby entrance"
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },

    category: {
      type: String,
      enum: {
        values: [
          'electrical',
          'plumbing',
          'hvac',
          'furniture',
          'appliances',
          'structural',
          'exterior',
          'other',
        ],
        message: '{VALUE} is not a valid maintenance category',
      },
      required: [true, 'Category is required'],
    },

    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'critical'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'normal',
    },

    status: {
      type: String,
      enum: {
        values: [
          'open',
          'assigned',
          'in_progress',
          'resolved',
          'closed',
          'cancelled',
        ],
        message: '{VALUE} is not a valid maintenance status',
      },
      default: 'open',
    },

    // Short title summarizing the issue
    // Example: "Air conditioning not cooling", "Toilet not flushing"
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Detailed description of the problem
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },

    // Who reported this issue (User account)
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported by is required'],
    },

    // Which maintenance staff member is assigned to fix it
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },

    assignedAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
    },

    closedAt: {
      type: Date,
    },

    // What was done to fix the issue
    resolutionNotes: {
      type: String,
      trim: true,
    },

    // Cost of repair in ETB (labor + parts)
    repairCost: {
      type: Number,
      min: 0,
    },

    // Description of spare parts used in the repair
    partsUsed: {
      type: String,
      trim: true,
    },

    // Whether the room must be taken out of service
    // while the repair is being done
    // true → room status set to 'maintenance' automatically
    requiresRoomClosure: {
      type: Boolean,
      default: false,
    },

    // Photos of the issue for documentation
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up the maintenance board which shows open requests
maintenanceRequestSchema.index({ status: 1, priority: -1 });

// Speeds up finding all maintenance history for a specific room
maintenanceRequestSchema.index({ room: 1 });

// Speeds up finding tasks assigned to a specific technician
maintenanceRequestSchema.index({ assignedTo: 1 });

// ── Virtual: Formatted Repair Cost ───────────────────────────
maintenanceRequestSchema.virtual('formattedRepairCost').get(function (
  this: IMaintenanceRequest
) {
  if (!this.repairCost) return 'N/A';
  return `ETB ${this.repairCost.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// ── Virtual: Resolution Time ──────────────────────────────────
// How long it took to resolve the issue in hours
maintenanceRequestSchema.virtual('resolutionTimeHours').get(function (
  this: IMaintenanceRequest
) {
  if (!this.resolvedAt) return null;
  const diffMs =
    this.resolvedAt.getTime() - this.createdAt.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
});

// ── Virtual: Is Overdue ───────────────────────────────────────
// Critical issues not resolved within 2 hours are overdue
// High priority issues not resolved within 8 hours are overdue
// Normal issues not resolved within 24 hours are overdue
maintenanceRequestSchema.virtual('isOverdue').get(function (
  this: IMaintenanceRequest
) {
  if (this.status === 'resolved' || this.status === 'closed' || this.status === 'cancelled') {
    return false;
  }

  const now = Date.now();
  const createdTime = this.createdAt.getTime();
  const elapsedHours = (now - createdTime) / (1000 * 60 * 60);

  if (this.priority === 'critical') return elapsedHours > 2;
  if (this.priority === 'high') return elapsedHours > 8;
  if (this.priority === 'normal') return elapsedHours > 24;
  return elapsedHours > 72; // low priority — 3 days
});

maintenanceRequestSchema.set('toJSON', { virtuals: true });
maintenanceRequestSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const MaintenanceRequest: Model<IMaintenanceRequest> =
  model<IMaintenanceRequest>(
    'MaintenanceRequest',
    maintenanceRequestSchema
  );

export default MaintenanceRequest;
