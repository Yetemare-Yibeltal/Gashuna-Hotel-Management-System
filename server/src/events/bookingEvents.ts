import { EventEmitter } from 'events';
import Notification from '../models/Notification';
import User from '../models/User';

export const bookingEmitter = new EventEmitter();

bookingEmitter.on(
  'booking:created',
  async (booking: {
    _id: string;
    bookingRef: string;
    guest: { fullName: string; vip: boolean };
    room: { name: string; roomNumber: string };
    checkIn: Date;
    checkOut: Date;
    nights: number;
    totalAmount: number;
  }) => {
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          type: 'info',
          event: 'NEW_BOOKING',
          title: `New Booking — ${booking.bookingRef}`,
          message: `${booking.guest.fullName} booked ${booking.room.name} (Room ${booking.room.roomNumber}) for ${booking.nights} night(s).${booking.guest.vip ? ' ⭐ VIP Guest' : ''}`,
          link: `/admin/reservations/${booking._id}`,
        });
      }
    } catch (error) {
      console.error('bookingEmitter booking:created error:', error);
    }
  }
);

bookingEmitter.on(
  'booking:cancelled',
  async (booking: {
    _id: string;
    bookingRef: string;
    cancellationReason?: string;
  }) => {
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          type: 'warning',
          event: 'BOOKING_CANCELLED',
          title: `Booking Cancelled — ${booking.bookingRef}`,
          message: `Booking ${booking.bookingRef} has been cancelled. Reason: ${booking.cancellationReason || 'Not specified'}`,
          link: `/admin/reservations/${booking._id}`,
        });
      }
    } catch (error) {
      console.error('bookingEmitter booking:cancelled error:', error);
    }
  }
);

export default bookingEmitter;
