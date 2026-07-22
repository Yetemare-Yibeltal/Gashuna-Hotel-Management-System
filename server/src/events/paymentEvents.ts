import { EventEmitter } from 'events';
import Notification from '../models/Notification';
import User from '../models/User';
import { formatETB } from '../utils/formatCurrency';

export const paymentEmitter = new EventEmitter();

paymentEmitter.on(
  'payment:success',
  async (payment: {
    _id: string;
    paymentRef: string;
    amount: number;
    channel?: string;
    bookingRef?: string;
  }) => {
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          type: 'success',
          event: 'PAYMENT_RECEIVED',
          title: `Payment Received — ${formatETB(payment.amount)}`,
          message: `Payment of ${formatETB(payment.amount)} received via ${payment.channel || 'unknown'}. ${payment.bookingRef ? `Booking: ${payment.bookingRef}` : ''}`,
          link: '/admin/billing',
        });
      }
    } catch (error) {
      console.error('paymentEmitter payment:success error:', error);
    }
  }
);

paymentEmitter.on(
  'payment:failed',
  async (payment: {
    paymentRef: string;
    amount: number;
    failureReason?: string;
  }) => {
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'manager'] },
        isActive: true,
      });

      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          type: 'error',
          event: 'PAYMENT_FAILED',
          title: `Payment Failed — ${formatETB(payment.amount)}`,
          message: `Payment of ${formatETB(payment.amount)} failed. Reason: ${payment.failureReason || 'Unknown'}`,
          link: '/admin/billing',
        });
      }
    } catch (error) {
      console.error('paymentEmitter payment:failed error:', error);
    }
  }
);

export default paymentEmitter;
