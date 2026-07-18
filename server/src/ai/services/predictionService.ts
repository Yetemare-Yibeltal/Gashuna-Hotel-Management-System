import { generateStructuredResponse } from './openaiService';
import {
  PREDICTION_PROMPT,
} from '../prompts/reportPrompt';
import Booking from '../../../models/Booking';
import Invoice from '../../../models/Invoice';
import Room from '../../../models/Room';

export interface OccupancyPrediction {
  prediction: number;
  unit: string;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reasoning: string;
  weeklyBreakdown: Array<{ week: number; predicted: number }>;
  factors: string[];
  risks: string[];
}

export interface RevenuePrediction {
  prediction: number;
  unit: string;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reasoning: string;
  weeklyBreakdown: Array<{ week: number; predicted: number }>;
  factors: string[];
  risks: string[];
}

export interface PredictionInsights {
  occupancy: OccupancyPrediction;
  revenue: RevenuePrediction;
  recommendedActions: string[];
  peakDates: string[];
  generatedAt: Date;
}

const getHistoricalBookingData = async (
  months: number = 3
): Promise<Record<string, unknown>> => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const bookingsByMonth = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['checked_out', 'checked_in', 'confirmed'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalBookings: { $sum: 1 },
        totalNights: { $sum: '$nights' },
        totalRevenue: { $sum: '$totalAmount' },
        avgNights: { $avg: '$nights' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const bookingsBySource = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRooms = await Room.countDocuments({ isActive: true });

  const occupancyByMonth = bookingsByMonth.map((month) => {
    const daysInMonth = new Date(
      month._id.year,
      month._id.month,
      0
    ).getDate();
    const totalRoomNights = totalRooms * daysInMonth;
    const occupancyRate =
      totalRoomNights > 0
        ? Math.round(
            (month.totalNights / totalRoomNights) * 100 * 10
          ) / 10
        : 0;

    return {
      ...month,
      occupancyRate,
      totalRoomNights,
    };
  });

  return {
    historicalPeriod: `Last ${months} months`,
    totalRooms,
    bookingsByMonth: occupancyByMonth,
    bookingsBySource,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
  };
};

const getHistoricalRevenueData = async (
  months: number = 3
): Promise<Record<string, unknown>> => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const revenueByMonth = await Invoice.aggregate([
    {
      $match: {
        status: 'paid',
        paidAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' },
        },
        totalRevenue: { $sum: '$total' },
        totalVAT: { $sum: '$vatAmount' },
        invoiceCount: { $sum: 1 },
        avgInvoiceValue: { $avg: '$total' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const revenueByPaymentMethod = await Invoice.aggregate([
    {
      $match: {
        status: 'paid',
        paidAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$total' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return {
    historicalPeriod: `Last ${months} months`,
    revenueByMonth,
    revenueByPaymentMethod,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
  };
};

export const predictOccupancy = async (): Promise<OccupancyPrediction> => {
  try {
    const historicalData = await getHistoricalBookingData(3);
    const prompt = PREDICTION_PROMPT(historicalData, 'occupancy');

    const result =
      await generateStructuredResponse<OccupancyPrediction>(prompt);

    return (
      result.data || {
        prediction: 65,
        unit: 'percentage',
        confidence: 0.5,
        trend: 'stable',
        reasoning: 'Insufficient data for accurate prediction.',
        weeklyBreakdown: [
          { week: 1, predicted: 65 },
          { week: 2, predicted: 65 },
          { week: 3, predicted: 65 },
          { week: 4, predicted: 65 },
        ],
        factors: ['Historical average occupancy'],
        risks: ['Insufficient historical data'],
      }
    );
  } catch {
    return {
      prediction: 65,
      unit: 'percentage',
      confidence: 0.3,
      trend: 'stable',
      reasoning: 'Prediction service temporarily unavailable.',
      weeklyBreakdown: [
        { week: 1, predicted: 65 },
        { week: 2, predicted: 65 },
        { week: 3, predicted: 65 },
        { week: 4, predicted: 65 },
      ],
      factors: [],
      risks: ['Prediction service error'],
    };
  }
};

export const predictRevenue = async (): Promise<RevenuePrediction> => {
  try {
    const historicalData = await getHistoricalRevenueData(3);
    const prompt = PREDICTION_PROMPT(historicalData, 'revenue');

    const result =
      await generateStructuredResponse<RevenuePrediction>(prompt);

    return (
      result.data || {
        prediction: 150000,
        unit: 'ETB',
        confidence: 0.5,
        trend: 'stable',
        reasoning: 'Insufficient data for accurate prediction.',
        weeklyBreakdown: [
          { week: 1, predicted: 37500 },
          { week: 2, predicted: 37500 },
          { week: 3, predicted: 37500 },
          { week: 4, predicted: 37500 },
        ],
        factors: ['Historical average revenue'],
        risks: ['Insufficient historical data'],
      }
    );
  } catch {
    return {
      prediction: 150000,
      unit: 'ETB',
      confidence: 0.3,
      trend: 'stable',
      reasoning: 'Prediction service temporarily unavailable.',
      weeklyBreakdown: [
        { week: 1, predicted: 37500 },
        { week: 2, predicted: 37500 },
        { week: 3, predicted: 37500 },
        { week: 4, predicted: 37500 },
      ],
      factors: [],
      risks: ['Prediction service error'],
    };
  }
};

export const generatePredictionInsights =
  async (): Promise<PredictionInsights> => {
    const [occupancy, revenue] = await Promise.all([
      predictOccupancy(),
      predictRevenue(),
    ]);

    const recommendedActions: string[] = [];
    const peakDates: string[] = [];

    if (occupancy.prediction < 50) {
      recommendedActions.push(
        'Low occupancy predicted — consider promotional rates or special packages.'
      );
      recommendedActions.push(
        'Reach out to travel agents and tour operators in the Amhara Region.'
      );
    }

    if (occupancy.prediction > 80) {
      recommendedActions.push(
        'High occupancy expected — ensure all rooms are in perfect condition.'
      );
      recommendedActions.push(
        'Consider hiring temporary staff to handle increased demand.'
      );
      peakDates.push('High demand period predicted for next 30 days.');
    }

    if (revenue.trend === 'decreasing') {
      recommendedActions.push(
        'Revenue trend is declining — review pricing strategy.'
      );
      recommendedActions.push(
        'Consider offering value-added packages including Blue Nile Gorge tours.'
      );
    }

    if (revenue.trend === 'increasing') {
      recommendedActions.push(
        'Revenue is growing — maintain current service quality standards.'
      );
    }

    if (occupancy.trend === 'increasing') {
      peakDates.push(
        'Occupancy is trending upward — prepare for higher volume.'
      );
    }

    return {
      occupancy,
      revenue,
      recommendedActions,
      peakDates,
      generatedAt: new Date(),
    };
  };
