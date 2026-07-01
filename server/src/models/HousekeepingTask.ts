// server/src/models/HousekeepingTask.ts
// ─────────────────────────────────────────────────────────────
// HOUSEKEEPING TASK MODEL — Gashuna Hotel Management System
//
// Represents a cleaning or maintenance preparation task
// assigned to a housekeeper for a specific room.
//
// Tasks are created automatically when:
//   - A guest checks out (status → cleaning)
//   - A room is flagged for inspection
//   - A supervisor manually creates a deep clean task
//
// Task types:
//   checkout_clean  — standard cleaning after guest checkout
//                     Change linen, clean bathroom, restock
//   daily_clean     — daily refresh for occupied rooms
//                     (guest is still staying)
//   deep_clean      — thorough periodic deep cleaning
//   inspection      — supervisor room inspection check
//   turndown        — evening turndown service
//   special_prep    — VIP guest arrival preparation
//
// Task priority:
//   low     — can be done anytime today
//   normal  — should be done within 2 hours
//   high    — must be done immediately (VIP arrival soon)
//   urgent  — emergency (spill, complaint, etc.)
//
// Task status lifecycle:
//   pending     → task created, not yet started
//   in_progress → housekeeper is currently cleaning the room
//   done        → cleaning complete, awaiting inspection
//   inspected   → supervisor has inspected and approved
//   issue_found → inspection found a problem, needs redo
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type HousekeepingTaskType =
  | 'checkout_clean'
  | 'daily_clean'
  | 'deep_clean'
  | 'inspection'
  | 'turndown'
  | 'special_prep';

export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';

export type HousekeepingStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'inspected'
  | 'issue_found';

// ── Checklist Item Interface ──────────────────────────────────
// Each housekeeping task has a checklist of items to complete
export interface IChecklistItem {
  task: string;
  isCompleted: boolean;
}

// ── Housekeeping Task Document Interface ──────────────────────
export interface IHousekeepingTask extends Document {
  room: Types.ObjectId;
  booking?: Types.ObjectId;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: Types.ObjectId;
  assignedBy?: Types.ObjectId;
  checklist: IChecklistItem[];
  startedAt?: Date;
  completedAt?: Date;
  inspectedAt?: Date;
  inspectedBy?: Types.ObjectId;
  inspectionNotes?: string;
  issueDescription?: string;
  estimatedDuration: number;
  actualDuration?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Checklist Item Sub-Schema ─────────────────────────────────
const checklistItemSchema = new Schema<IChecklistItem>(
  {
    task: {
      type: String,
      required: [true, 'Checklist task description is required'],
      trim: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// ── Default Checkout Clean Checklist ──────────────────────────
// Standard checklist used for checkout cleaning tasks
// Can be customized per task
export const DEFAULT_CHECKOUT_CHECKLIST: IChecklistItem[] = [
  { task: 'Strip and replace all bed linen', isCompleted: false },
  { task: 'Replace all pillow cases', isCompleted: false },
  { task: 'Clean and disinfect bathroom', isCompleted: false },
  { task: 'Replace towels and bath mat', isCompleted: false },
  { task: 'Restock bathroom amenities (soap, shampoo)', isCompleted: false },
  { task: 'Empty and clean wastebaskets', isCompleted: false },
  { task: 'Vacuum carpet or mop floor', isCompleted: false },
  { task: 'Dust all furniture and surfaces', isCompleted: false },
  { task: 'Clean mirrors and windows', isCompleted: false },
  { task: 'Check and restock minibar', isCompleted: false },
  { task: 'Restock tea, coffee, and water', isCompleted: false },
  { task: 'Check all lights are working', isCompleted: false },
  { task: 'Check TV remote has batteries', isCompleted: false },
  { task: 'Report any damages to supervisor', isCompleted: false },
];

// ── Housekeeping Task Schema ───────────────────────────────────
const housekeepingTaskSchema = new Schema<IHousekeepingTask>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required for a housekeeping task'],
    },

    // Optional link to the booking that triggered this task
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },

    taskType: {
      type: String,
      enum: {
        values: [
          'checkout_clean',
          'daily_clean',
          'deep_clean',
          'inspection',
          'turndown',
          'special_prep',
        ],
        message: '{VALUE} is not a valid housekeeping task type',
      },
      required: [true, 'Task type is required'],
    },

    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'normal',
    },

    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'in_progress',
          'done',
          'inspected',
          'issue_found',
        ],
        message: '{VALUE} is not a valid task status',
      },
      default: 'pending',
    },

    // Which housekeeper is assigned to clean this room
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },

    // Which supervisor created/assigned this task
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // List of specific cleaning tasks to complete
    // Defaults to the standard checkout checklist
    checklist: {
      type: [checklistItemSchema],
      default: DEFAULT_CHECKOUT_CHECKLIST,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    inspectedAt: {
      type: Date,
    },

    inspectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Notes written by the supervisor after inspection
    // Example: "Bathroom needs more attention next time"
    inspectionNotes: {
      type: String,
      trim: true,
    },

    // Description of any issue found during inspection
    // Example: "Shower curtain is torn, needs replacement"
    issueDescription: {
      type: String,
      trim: true,
    },

    // Expected time to complete the task in minutes
    estimatedDuration: {
      type: Number,
      default: 45,
      min: [1, 'Estimated duration must be at least 1 minute'],
    },

    // Actual time taken to complete in minutes
    // Calculated from startedAt to completedAt
    actualDuration: {
      type: Number,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────
// Speeds up the housekeeping board which shows tasks by status
housekeepingTaskSchema.index({ status: 1, priority: -1 });

// Speeds up finding all tasks for a specific room
housekeepingTaskSchema.index({ room: 1 });

// Speeds up finding all tasks assigned to a specific housekeeper
housekeepingTaskSchema.index({ assignedTo: 1, status: 1 });

// ── Pre-Save Hook: Calculate Actual Duration ──────────────────
// Automatically calculates how long the task took
// when completedAt is set
housekeepingTaskSchema.pre('save', function (next) {
  if (this.startedAt && this.completedAt) {
    const diffMs =
      this.completedAt.getTime() - this.startedAt.getTime();
    this.actualDuration = Math.round(diffMs / (1000 * 60)); // minutes
  }
  next();
});

// ── Virtual: Completion Percentage ───────────────────────────
// Calculates what percentage of checklist items are done
housekeepingTaskSchema.virtual('completionPercentage').get(function (
  this: IHousekeepingTask
) {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter((item) => item.isCompleted).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// ── Virtual: Is Overdue ───────────────────────────────────────
// Returns true if the task is still pending after 3 hours
housekeepingTaskSchema.virtual('isOverdue').get(function (
  this: IHousekeepingTask
) {
  if (this.status !== 'pending' && this.status !== 'in_progress') {
    return false;
  }
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return this.createdAt < threeHoursAgo;
});

housekeepingTaskSchema.set('toJSON', { virtuals: true });
housekeepingTaskSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const HousekeepingTask: Model<IHousekeepingTask> =
  model<IHousekeepingTask>('HousekeepingTask', housekeepingTaskSchema);

export default HousekeepingTask;
