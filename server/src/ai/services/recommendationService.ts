import { generateStructuredResponse } from './openaiService';
import {
  RECOMMENDATION_PROMPT,
  GUEST_INSIGHTS_PROMPT,
} from '../prompts/reportPrompt';
import Room from '../../../models/Room';
import Guest from '../../../models/Guest';
import Booking from '../../../models/Booking';

export interface RoomRecommendation {
  topRecommendation: {
    roomId: string;
    roomName: string;
    reason: string;
  };
  alternatives: Array<{
    roomId: string;
    roomName: string;
    reason: string;
  }>;
  personalizedMessage: string;
  upsellOpportunity: string;
}

export interface GuestInsights {
  guestType: 'frequent' | 'occasional' | 'new' | 'vip';
  preferences: string[];
  loyaltyInsight: string;
  staffTips: string[];
  upsellOpportunities: string[];
  riskFlags: string[];
  welcomeNote: string;
}

export const getPersonalizedRoomRecommendations = async (
  guestId: string,
  checkIn: Date,
  checkOut: Date,
  adults: number = 1,
  children: number = 0
): Promise<RoomRecommendation> => {
  try {
    const guest = await Guest.findById(guestId);

    if (!guest) {
      throw new Error('Guest not found');
    }

    const bookedRoomIds = await Booking.distinct('room', {
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    const availableRooms = await Room.find({
      isActive: true,
      status: { $nin: ['maintenance'] },
      _id: { $nin: bookedRoomIds },
      capacity: { $gte: adults + children },
    }).select('name roomNumber type floor price capacity beds amenities description view');

    if (availableRooms.length === 0) {
      return {
        topRecommendation: {
          roomId: '',
          roomName: 'No rooms available',
          reason: 'No rooms available for the selected dates.',
        },
        alternatives: [],
        personalizedMessage: `Dear ${guest.fullName}, we apologize but no rooms are available for your selected dates. Please contact us for assistance.`,
        upsellOpportunity: '',
      };
    }

    const guestHistory = await Booking.find({
      guest: guestId,
      status: 'checked_out',
    })
      .populate('room', 'type price name')
      .sort({ createdAt: -1 })
      .limit(5);

    const guestProfile = {
      fullName: guest.fullName,
      nationality: guest.nationality,
      totalStays: guest.totalStays,
      totalSpent: guest.totalSpent,
      loyaltyPoints: guest.loyaltyPoints,
      vip: guest.vip,
      adults,
      children,
      previousRoomTypes: guestHistory.map((b) => {
        const room = b.room as { type: string; price: number };
        return { type: room?.type, price: room?.price };
      }),
      notes: guest.notes || '',
    };

    const availableRoomsData = availableRooms.map((room) => ({
      _id: room._id.toString(),
      name: room.name,
      type: room.type,
      floor: room.floor,
      view: room.view,
      price: room.price,
      capacity: room.capacity,
      beds: room.beds,
      amenities: room.amenities,
      description: room.description,
    }));

    const prompt = RECOMMENDATION_PROMPT(guestProfile, availableRoomsData);
    const result = await generateStructuredResponse<RoomRecommendation>(prompt);

    return (
      result.data || {
        topRecommendation: {
          roomId: availableRooms[0]._id.toString(),
          roomName: availableRooms[0].name,
          reason: 'Best available room for your stay.',
        },
        alternatives: availableRooms.slice(1, 3).map((room) => ({
          roomId: room._id.toString(),
          roomName: room.name,
          reason: 'Alternative option for your consideration.',
        })),
        personalizedMessage: `Welcome to Gashuna Hotel, ${guest.fullName}! We look forward to your stay.`,
        upsellOpportunity: 'Consider our Blue Nile Gorge tour package.',
      }
    );
  } catch {
    return {
      topRecommendation: {
        roomId: '',
        roomName: 'Standard Room',
        reason: 'Our comfortable standard rooms offer great value.',
      },
      alternatives: [],
      personalizedMessage:
        'Welcome to Gashuna Hotel! We look forward to hosting you.',
      upsellOpportunity:
        'Ask about our Blue Nile Gorge tour packages.',
    };
  }
};

export const getGuestInsights = async (
  guestId: string
): Promise<GuestInsights> => {
  try {
    const guest = await Guest.findById(guestId);

    if (!guest) {
      throw new Error('Guest not found');
    }

    const bookingHistory = await Booking.find({
      guest: guestId,
    })
      .populate('room', 'name type price floor')
      .sort({ createdAt: -1 })
      .limit(10);

    const guestData = {
      fullName: guest.fullName,
      nationality: guest.nationality,
      totalStays: guest.totalStays,
      totalSpent: guest.totalSpent,
      loyaltyPoints: guest.loyaltyPoints,
      vip: guest.vip,
      notes: guest.notes,
      memberSince: guest.createdAt,
      bookingHistory: bookingHistory.map((b) => ({
        bookingRef: b.bookingRef,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        totalAmount: b.totalAmount,
        status: b.status,
        room: b.room,
      })),
    };

    const prompt = GUEST_INSIGHTS_PROMPT(guestData);
    const result = await generateStructuredResponse<GuestInsights>(prompt);

    return (
      result.data || {
        guestType:
          guest.totalStays > 5
            ? 'frequent'
            : guest.totalStays > 1
            ? 'occasional'
            : 'new',
        preferences: [],
        loyaltyInsight: `Guest has ${guest.loyaltyPoints} loyalty points.`,
        staffTips: ['Greet the guest warmly upon arrival.'],
        upsellOpportunities: ['Offer Blue Nile Gorge tour package.'],
        riskFlags: [],
        welcomeNote: `Welcome back to Gashuna Hotel, ${guest.fullName}!`,
      }
    );
  } catch {
    return {
      guestType: 'new',
      preferences: [],
      loyaltyInsight: 'Unable to retrieve loyalty information.',
      staffTips: ['Provide standard welcoming service.'],
      upsellOpportunities: [],
      riskFlags: [],
      welcomeNote: 'Welcome to Gashuna Hotel!',
    };
  }
};

export const getServiceRecommendations = async (
  guestId: string
): Promise<string[]> => {
  try {
    const guest = await Guest.findById(guestId);
    if (!guest) return [];

    const recommendations: string[] = [];

    if (guest.nationality !== 'Ethiopia') {
      recommendations.push(
        'Blue Nile Gorge day tour — spectacular natural wonder 2 hours from Dangla'
      );
      recommendations.push(
        'Ethiopian coffee ceremony experience in our restaurant'
      );
      recommendations.push(
        'Currency exchange service available at the front desk'
      );
    }

    if (guest.vip) {
      recommendations.push(
        'VIP airport transfer service to/from Bahir Dar Airport'
      );
      recommendations.push(
        'Complimentary room upgrade subject to availability'
      );
    }

    if (guest.totalStays > 3) {
      recommendations.push(
        'Loyalty points redemption — you have enough points for a discount'
      );
    }

    recommendations.push('Lake Tana and Tis Abay Waterfall tour');
    recommendations.push('Conference hall available for business meetings');
    recommendations.push('Laundry service — same day delivery available');

    return recommendations.slice(0, 5);
  } catch {
    return [
      'Blue Nile Gorge day tour',
      'Airport transfer service',
      'Ethiopian coffee ceremony',
    ];
  }
};
