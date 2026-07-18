import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AppError from '../../utils/AppError';
import {
  getPersonalizedRoomRecommendations,
  getGuestInsights,
  getServiceRecommendations,
} from '../services/recommendationService';
import { AuthRequest } from '../../middleware/authMiddleware';
import Room from '../../../models/Room';
import Guest from '../../../models/Guest';

export const getRoomRecommendations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      guestId,
      checkIn,
      checkOut,
      adults,
      children,
    } = req.body;

    if (!guestId || !checkIn || !checkOut) {
      return next(
        new AppError(
          'Please provide guest ID, check-in date, and check-out date.',
          400
        )
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(
        new AppError('Invalid date format. Please use YYYY-MM-DD.', 400)
      );
    }

    if (checkOutDate <= checkInDate) {
      return next(
        new AppError('Check-out date must be after check-in date.', 400)
      );
    }

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    const recommendations = await getPersonalizedRoomRecommendations(
      guestId,
      checkInDate,
      checkOutDate,
      adults || 1,
      children || 0
    );

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id,
        fullName: guest.fullName,
        vip: guest.vip,
        loyaltyPoints: guest.loyaltyPoints,
        totalStays: guest.totalStays,
      },
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: adults || 1,
      children: children || 0,
      recommendations,
    });
  }
);

export const getGuestProfileInsights = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { guestId } = req.params;

    if (!guestId) {
      return next(new AppError('Please provide a guest ID.', 400));
    }

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    const insights = await getGuestInsights(guestId);

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id,
        fullName: guest.fullName,
        nationality: guest.nationality,
        vip: guest.vip,
        loyaltyPoints: guest.loyaltyPoints,
        totalStays: guest.totalStays,
        totalSpent: guest.totalSpent,
      },
      insights,
    });
  }
);

export const getGuestServiceRecommendations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { guestId } = req.params;

    if (!guestId) {
      return next(new AppError('Please provide a guest ID.', 400));
    }

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    const recommendations = await getServiceRecommendations(guestId);

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id,
        fullName: guest.fullName,
        vip: guest.vip,
        nationality: guest.nationality,
      },
      recommendations,
    });
  }
);

export const getSimilarRooms = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new AppError('Room not found.', 404));
    }

    const filter: Record<string, unknown> = {
      isActive: true,
      _id: { $ne: roomId },
      type: room.type,
    };

    if (checkIn && checkOut) {
      const { default: Booking } = await import('../../../models/Booking');
      const bookedRoomIds = await Booking.distinct('room', {
        status: { $in: ['pending', 'confirmed', 'checked_in'] },
        checkIn: { $lt: new Date(checkOut as string) },
        checkOut: { $gt: new Date(checkIn as string) },
      });
      filter._id = { $ne: roomId, $nin: bookedRoomIds };
    }

    const similarRooms = await Room.find(filter)
      .select('name roomNumber type floor view price capacity beds amenities images description')
      .limit(4);

    res.status(200).json({
      success: true,
      originalRoom: {
        _id: room._id,
        name: room.name,
        type: room.type,
        price: room.price,
      },
      similarRooms,
      count: similarRooms.length,
    });
  }
);

export const getPopularRooms = asyncHandler(
  async (req: Request, res: Response) => {
    const { default: Booking } = await import('../../../models/Booking');

    const popularRoomIds = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['checked_out', 'checked_in'] },
        },
      },
      {
        $group: {
          _id: '$room',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgNights: { $avg: '$nights' },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 6 },
    ]);

    const roomIds = popularRoomIds.map((r) => r._id);

    const rooms = await Room.find({
      _id: { $in: roomIds },
      isActive: true,
    }).select('name roomNumber type floor view price capacity beds amenities images description');

    const popularRooms = rooms.map((room) => {
      const stats = popularRoomIds.find(
        (r) => r._id.toString() === room._id.toString()
      );
      return {
        ...room.toObject(),
        bookingCount: stats?.bookingCount || 0,
        totalRevenue: stats?.totalRevenue || 0,
        avgNights: Math.round((stats?.avgNights || 0) * 10) / 10,
      };
    });

    popularRooms.sort((a, b) => b.bookingCount - a.bookingCount);

    res.status(200).json({
      success: true,
      count: popularRooms.length,
      popularRooms,
    });
  }
);

export const getUpsellOpportunities = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { guestId } = req.params;

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    const opportunities: Array<{
      type: string;
      title: string;
      description: string;
      potentialValue: string;
    }> = [];

    if (guest.loyaltyPoints >= 500) {
      opportunities.push({
        type: 'loyalty_redemption',
        title: 'Loyalty Points Redemption',
        description: `${guest.fullName} has ${guest.loyaltyPoints} points available for redemption.`,
        potentialValue: `ETB ${Math.floor(guest.loyaltyPoints / 10).toLocaleString()} discount`,
      });
    }

    if (!guest.vip && guest.totalSpent >= 40000) {
      opportunities.push({
        type: 'vip_upgrade',
        title: 'VIP Status Upgrade',
        description: `${guest.fullName} is close to VIP status (ETB ${(50000 - guest.totalSpent).toLocaleString()} away).`,
        potentialValue: 'VIP benefits and priority service',
      });
    }

    opportunities.push({
      type: 'tour_package',
      title: 'Blue Nile Gorge Tour Package',
      description: 'Offer the popular Blue Nile Gorge day tour.',
      potentialValue: 'ETB 800 per person',
    });

    opportunities.push({
      type: 'room_upgrade',
      title: 'Room Upgrade',
      description: 'Offer an upgrade to the next room category.',
      potentialValue: 'ETB 1,000 - 3,000 additional revenue',
    });

    if (guest.nationality !== 'Ethiopia') {
      opportunities.push({
        type: 'cultural_experience',
        title: 'Ethiopian Coffee Ceremony',
        description: 'Offer a traditional Ethiopian coffee ceremony experience.',
        potentialValue: 'ETB 200 per person',
      });
    }

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id,
        fullName: guest.fullName,
        vip: guest.vip,
        loyaltyPoints: guest.loyaltyPoints,
        totalStays: guest.totalStays,
        totalSpent: guest.totalSpent,
      },
      opportunities,
      count: opportunities.length,
    });
  }
);
