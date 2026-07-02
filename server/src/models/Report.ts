// server/src/models/Report.ts
// ─────────────────────────────────────────────────────────────
// REPORT MODEL — Gashuna Hotel Management System
//
// Stores saved snapshots of generated reports so they can
// be retrieved later without recalculating from scratch.
//
// Report types:
//   revenue        — monthly/yearly revenue summary in ETB
//   occupancy      — room occupancy rates and trends
//   guests         — guest statistics and nationality breakdown
//   payments       — payment method breakdown (Chapa/Telebirr/cash)
//   staff_payroll  — monthly payroll summary for all staff
//   inventory      — stock levels and consumption report
//   housekeeping   — room cleaning performance report
//   maintenance    — maintenance issues and resolution times
//   tax            — VAT summary for ERCA tax filing
//   custom         — any other custom report
//
// Reports are generated on demand by the reportController.ts
// and can be saved here for future reference.
//
// The reportData field stores the actual calculated report
// as a flexible JSON object — the structure varies by type.
//
// Reports can be exported to:
//   - PDF (using a PDF generation library)
//   - Excel/CSV (for accounting software import)
//
// This report archive is essential for:
//   - Monthly management meetings
//   - Ethiopian tax filing with ERCA
//   - Year-end financial summary
//   - Bank loan applications (revenue proof)
// ─────────────────────────────────────────────────────────────

import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Type Definitions ──────────────────────────────────────────
export type ReportType =
  | 'revenue'
  | 'occupancy'
  | 'guests'
  | 'payments'
  | 'staff_payroll'
  | 'inventory'
  | 'housekeeping'
  | 'maintenance'
  | 'tax'
  | 'custom';

export type ReportPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export type ReportStatus = 'generating' | 'ready' | 'failed';

// ── Report Document Interface ─────────────────────────────────
export interface IReport extends Document {
  title: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  status: ReportStatus;
  reportData: Record<string, unknown>;
  summary: string;
  generatedBy: Types.ObjectId;
  generatedAt: Date;
  exportedToPdf: boolean;
  exportedToExcel: boolean;
  pdfPath?: string;
  excelPath?: string;
  totalRevenueETB?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Report Schema ──────────────────────────────────────────────
const reportSchema = new Schema<IReport>(
  {
    // Descriptive title for the report
    // Example: "Monthly Revenue Report — June 2025"
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: [
          'revenue',
          'occupancy',
          'guests',
          'payments',
          'staff_payroll',
          'inventory',
          'housekeeping',
          'maintenance',
          'tax',
          'custom',
        ],
        message: '{VALUE} is not a valid report type',
      },
      required: [true, 'Report type is required'],
    },

    period: {
      type: String,
      enum: {
        values: [
          'daily',
          'weekly',
          'monthly',
          'quarterly',
          'yearly',
          'custom',
        ],
        message: '{VALUE} is not a valid report period',
      },
      required: [true, 'Report period is required'],
    },

    // The date range this report covers
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IReport, value: Date) {
          return value >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
    },

    status: {
      type: String,
      enum: {
        values: ['generating', 'ready', 'failed'],
        message: '{VALUE} is not a valid report status',
      },
      default: 'generating',
    },

    // The actual report data stored as flexible JSON
    // Structure varies by report type:
    //
    // Revenue report example:
    // {
    //   totalRevenue: 450000,
    //   roomRevenue: 380000,
    //   fbRevenue: 45000,
    //   serviceRevenue: 25000,
    //   byRoom: [...],
    //   byPaymentMethod: {...},
    //   dailyBreakdown: [...],
    // }
    //
    // Occupancy report example:
    // {
    //   averageOccupancy: 78.5,
    //   totalRoomNights: 1488,
    //   occupiedNights: 1168,
    //   adr: 2450,
    //   revpar: 1923,
    //   byRoomType: {...},
    //   weeklyTrend: [...],
    // }
    reportData: {
      type: Schema.Types.Mixed,
      required: [true, 'Report data is required'],
    },

    // One paragraph text summary of the report
    // Generated automatically based on the report data
    // Example: "Revenue for June 2025 was ETB 450,000 —
    //           up 23% from May 2025. Best performing room
    //           was the Presidential Suite at ETB 67,500."
    summary: {
      type: String,
      trim: true,
      default: '',
    },

    // Which admin user generated this report
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Generated by is required'],
    },

    // When the report was generated
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    // Track whether this report has been exported
    exportedToPdf: {
      type: Boolean,
      default: false,
    },

    exportedToExcel: {
      type: Boolean,
      default: false,
    },

    // File paths to exported files (if exported)
    pdfPath: {
      type: String,
      trim: true,
    },

    excelPath: {
      type: String,
      trim: true,
    },

    // Quick access field for the total revenue in ETB
    // Used to display revenue total on the reports list
    // without loading the full reportData JSON
    totalRevenueETB: {
      type: Number,
      min: 0,
    },

    // Any additional notes added by the manager
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
// Speeds up filtering reports by type
reportSchema.index({ type: 1 });

// Speeds up filtering reports by date range
reportSchema.index({ startDate: -1 });

// Speeds up finding reports by who generated them
reportSchema.index({ generatedBy: 1 });

// ── Virtual: Formatted Total Revenue ─────────────────────────
reportSchema.virtual('formattedTotalRevenue').get(function (
  this: IReport
) {
  if (!this.totalRevenueETB) return 'N/A';
  return `ETB ${this.totalRevenueETB.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// ── Virtual: Date Range Display ───────────────────────────────
// Returns a human-readable date range string
// Example: "June 1, 2025 — June 30, 2025"
reportSchema.virtual('dateRangeDisplay').get(function (this: IReport) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const start = this.startDate.toLocaleDateString('en-US', options);
  const end = this.endDate.toLocaleDateString('en-US', options);
  return `${start} — ${end}`;
});

// ── Virtual: Is Ready ─────────────────────────────────────────
reportSchema.virtual('isReady').get(function (this: IReport) {
  return this.status === 'ready';
});

reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

// ── Create and Export Model ───────────────────────────────────
const Report: Model<IReport> = model<IReport>('Report', reportSchema);

export default Report;
