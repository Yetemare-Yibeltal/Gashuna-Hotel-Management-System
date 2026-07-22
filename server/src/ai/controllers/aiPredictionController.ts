import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AppError from '../../utils/AppError';
import {
  predictOccupancy,
  predictRevenue,
  generatePredictionInsights,
} from '../services/predictionService';
import {
  analyzeSentiment,
  analyzeGuestFeedback,
} from '../services/sentimentService';
import { AuthRequest } from '../../middleware/authMiddleware';
import Booking from '../../../models/Booking';
import Invoice from '../../../models/Invoice';
import Guest from '../../../models/Guest';

export const getOccupancyPrediction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const prediction = await predictOccupancy();

    res.status(200).json({
      success: true,
      prediction,
      generatedAt: new Date(),
      note: 'Prediction based on last 3 months of booking data.',
    });
  }
);

export const getRevenuePrediction = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const prediction = await predictRevenue();

    res.status(200).json({
      success: true,
      prediction,
      currency: 'ETB',
      generatedAt: new Date(),
      note: 'Revenue prediction based on last 3 months of invoice data.',
    });
  }
);

export const getFullPredictionInsights = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const insights = await generatePredictionInsights();

    res.status(200).json({
      success: true,
      insights,
      hotel: 'Gashuna Hotel — Dangla, Ethiopia',
    });
  }
);

export const analyzeFeedbackSentiment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return next(
        new AppError('Please provide text to analyze.', 400)
      );
    }

    if (text.length > 5000) {
      return next(
        new AppError('Text too long. Maximum is 5000 characters.', 400)
      );
    }

    const result = await analyzeSentiment(text);

    res.status(200).json({
      success: true,
      text,
      sentiment: result,
    });
  }
);

export const analyzeAllGuestFeedback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { days } = req.query;
    const daysBack = parseInt(days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const bookingsWithFeedback = await Booking.find({
      specialRequests: { $exists: true, $ne: '' },
      createdAt: { $gte: startDate },
    })
      .select('specialRequests createdAt source')
      .limit(100);

    if (bookingsWithFeedback.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No guest feedback found for the specified period.',
        period: `Last ${daysBack} days`,
        feedbackCount: 0,
      });
    }

    const feedbackItems = bookingsWithFeedback
      .filter(
        (b) =>
          b.specialRequests && b.specialRequests.trim().length > 10
      )
      .map((b) => ({
        text: b.specialRequests as string,
        source: b.source,
        date: b.createdAt,
      }));

    const analysis = await analyzeGuestFeedback(feedbackItems);

    res.status(200).json({
      success: true,
      period: `Last ${daysBack} days`,
      feedbackCount: feedbackItems.length,
      analysis,
    });
  }
);

export const getBookingTrends = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { months } = req.query;
    const monthsBack = parseInt(months as string) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const bookingTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgNights: { $avg: '$nights' },
          confirmedBookings: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['confirmed', 'checked_in', 'checked_out'],
                  ],
                },
                1,
                0,
              ],
            },
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const sourceBreakdown = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const cancellationRate = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          cancellationRate: {
            $multiply: [{ $divide: ['$cancelled', '$total'] }, 100],
          },
          total: 1,
          cancelled: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      period: `Last ${monthsBack} months`,
      bookingTrends,
      sourceBreakdown,
      cancellationRate: cancellationRate[0] || {
        total: 0,
        cancelled: 0,
        cancellationRate: 0,
      },
    });
  }
);

export const getRevenueTrends = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { months } = req.query;
    const monthsBack = parseInt(months as string) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const revenueTrends = await Invoice.aggregate([
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

    const paymentMethodTrends = await Invoice.aggregate([
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

    const totalRevenue = revenueTrends.reduce(
      (sum, month) => sum + month.totalRevenue,
      0
    );
    const totalVAT = revenueTrends.reduce(
      (sum, month) => sum + month.totalVAT,
      0
    );

    res.status(200).json({
      success: true,
      period: `Last ${monthsBack} months`,
      summary: {
        totalRevenue,
        totalVAT,
        netRevenue: totalRevenue - totalVAT,
        currency: 'ETB',
      },
      revenueTrends,
      paymentMethodTrends,
    });
  }
);

export const getGuestAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const [totalGuests, vipGuests, repeatGuests, newGuestsThisMonth] =
      await Promise.all([
        Guest.countDocuments(),
        Guest.countDocuments({ vip: true }),
        Guest.countDocuments({ totalStays: { $gt: 1 } }),
        Guest.countDocuments({
          createdAt: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
          },
        }),
      ]);

    const nationalityBreakdown = await Guest.aggregate([
      {
        $group: {
          _id: '$nationality',
          count: { $sum: 1 },
          avgSpend: { $avg: '$totalSpent' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const loyaltyDistribution = await Guest.aggregate([
      {
        $bucket: {
          groupBy: '$loyaltyPoints',
          boundaries: [0, 100, 500, 1000, 5000, 10000],
          default: '10000+',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const topSpenders = await Guest.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select(
        'fullName nationality totalSpent totalStays vip loyaltyPoints'
      );

    res.status(200).json({
      success: true,
      analytics: {
        totalGuests,
        vipGuests,
        repeatGuests,
        newGuestsThisMonth,
        repeatGuestRate:
          totalGuests > 0
            ? Math.round(
                (repeatGuests / totalGuests) * 100 * 10
              ) / 10
            : 0,
        nationalityBreakdown,
        loyaltyDistribution,
        topSpenders,
      },
    });
  }
);
