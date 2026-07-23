import { Schema, model, Document, Model, Types } from 'mongoose';

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

const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    requestNumber: {
      type: String,
      required: [true, 'Request number is required'],
      unique: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
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
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported by is required'],
    },
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
    resolutionNotes: {
      type: String,
      trim: true,
    },
    repairCost: {
      type: Number,
      min: 0,
    },
    partsUsed: {
      type: String,
      trim: true,
    },
    requiresRoomClosure: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRequestSchema.index({ status: 1, priority: -1 });
maintenanceRequestSchema.index({ room: 1 });
maintenanceRequestSchema.index({ assignedTo: 1 });

maintenanceRequestSchema.virtual('formattedRepairCost').get(function (
  this: IMaintenanceRequest
) {
  if (!this.repairCost) return 'N/A';
  return `ETB ${this.repairCost.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

maintenanceRequestSchema.virtual('resolutionTimeHours').get(function (
  this: IMaintenanceRequest
) {
  if (!this.resolvedAt) return null;
  const diffMs = this.resolvedAt.getTime() - this.createdAt.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
});

maintenanceRequestSchema.virtual('isOverdue').get(function (
  this: IMaintenanceRequest
) {
  if (
    this.status === 'resolved' ||
    this.status === 'closed' ||
    this.status === 'cancelled'
  ) {
    return false;
  }

  const now = Date.now();
  const createdTime = this.createdAt.getTime();
  const elapsedHours = (now - createdTime) / (1000 * 60 * 60);

  if (this.priority === 'critical') return elapsedHours > 2;
  if (this.priority === 'high') return elapsedHours > 8;
  if (this.priority === 'normal') return elapsedHours > 24;
  return elapsedHours > 72;
});

maintenanceRequestSchema.set('toJSON', { virtuals: true });
maintenanceRequestSchema.set('toObject', { virtuals: true });

const MaintenanceRequest: Model<IMaintenanceRequest> =
  model<IMaintenanceRequest>(
    'MaintenanceRequest',
    maintenanceRequestSchema
  );

export default MaintenanceRequest;
