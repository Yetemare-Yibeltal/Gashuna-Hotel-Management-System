import { v4 as uuidv4 } from 'uuid';
import AIConversation from '../models/AIConversation';
import { ChatMessage } from '../services/openaiService';

export const generateSessionId = (): string => {
  return `gsh-session-${uuidv4()}`;
};

export const getOrCreateConversation = async (
  sessionId: string,
  guestId?: string,
  userId?: string,
  channel: 'web_chat' | 'voice' | 'admin_chat' = 'web_chat'
) => {
  let conversation = await AIConversation.findOne({ sessionId });

  if (!conversation) {
    conversation = await AIConversation.create({
      sessionId,
      guest: guestId || undefined,
      user: userId || undefined,
      channel,
      language: 'en',
      messages: [],
      totalTokensUsed: 0,
      isActive: true,
    });
  }

  return conversation;
};

export const buildConversationHistory = (
  messages: Array<{
    role: string;
    content: string;
  }>,
  maxMessages: number = 10
): ChatMessage[] => {
  return messages
    .filter((m) => m.role !== 'system')
    .slice(-maxMessages)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
};

export const addMessageToConversation = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed: number = 0,
  audioUrl?: string
) => {
  const conversation = await AIConversation.findOne({ sessionId });

  if (!conversation) return null;

  conversation.messages.push({
    role,
    content,
    timestamp: new Date(),
    audioUrl,
    tokensUsed,
  });

  conversation.totalTokensUsed += tokensUsed;
  await conversation.save();

  return conversation;
};

export const formatCurrencyForAI = (amount: number): string => {
  return `ETB ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .slice(0, 2000);
};

export const isValidSessionId = (sessionId: string): boolean => {
  return (
    typeof sessionId === 'string' &&
    sessionId.startsWith('gsh-session-') &&
    sessionId.length > 20
  );
};

export const getConversationContext = async (
  sessionId: string
): Promise<string> => {
  const conversation = await AIConversation.findOne({ sessionId })
    .populate('guest', 'fullName nationality vip loyaltyPoints totalStays')
    .populate('user', 'name role');

  if (!conversation) return '';

  const contextParts: string[] = [];

  if (conversation.guest) {
    const guest = conversation.guest as {
      fullName: string;
      nationality: string;
      vip: boolean;
      loyaltyPoints: number;
      totalStays: number;
    };
    contextParts.push(`Guest: ${guest.fullName}`);
    contextParts.push(`Nationality: ${guest.nationality}`);
    contextParts.push(`VIP: ${guest.vip ? 'Yes' : 'No'}`);
    contextParts.push(`Loyalty Points: ${guest.loyaltyPoints}`);
    contextParts.push(`Total Stays: ${guest.totalStays}`);
  }

  if (conversation.user) {
    const user = conversation.user as { name: string; role: string };
    contextParts.push(`Staff: ${user.name} (${user.role})`);
  }

  return contextParts.join('\n');
};

export const detectIntentFromMessage = (
  message: string
): string => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('book') ||
    lowerMessage.includes('reserve') ||
    lowerMessage.includes('reservation')
  ) {
    return 'booking';
  }

  if (
    lowerMessage.includes('room') ||
    lowerMessage.includes('suite') ||
    lowerMessage.includes('price') ||
    lowerMessage.includes('rate')
  ) {
    return 'room_inquiry';
  }

  if (
    lowerMessage.includes('food') ||
    lowerMessage.includes('menu') ||
    lowerMessage.includes('restaurant') ||
    lowerMessage.includes('eat') ||
    lowerMessage.includes('injera') ||
    lowerMessage.includes('tibs')
  ) {
    return 'food';
  }

  if (
    lowerMessage.includes('tour') ||
    lowerMessage.includes('blue nile') ||
    lowerMessage.includes('lake tana') ||
    lowerMessage.includes('attraction') ||
    lowerMessage.includes('visit')
  ) {
    return 'tours';
  }

  if (
    lowerMessage.includes('check in') ||
    lowerMessage.includes('check out') ||
    lowerMessage.includes('checkout') ||
    lowerMessage.includes('checkin') ||
    lowerMessage.includes('arrival') ||
    lowerMessage.includes('departure')
  ) {
    return 'check_in_out';
  }

  if (
    lowerMessage.includes('payment') ||
    lowerMessage.includes('pay') ||
    lowerMessage.includes('chapa') ||
    lowerMessage.includes('telebirr') ||
    lowerMessage.includes('price')
  ) {
    return 'payment';
  }

  if (
    lowerMessage.includes('complaint') ||
    lowerMessage.includes('problem') ||
    lowerMessage.includes('issue') ||
    lowerMessage.includes('bad') ||
    lowerMessage.includes('wrong')
  ) {
    return 'complaint';
  }

  if (
    lowerMessage.includes('wifi') ||
    lowerMessage.includes('laundry') ||
    lowerMessage.includes('transfer') ||
    lowerMessage.includes('service') ||
    lowerMessage.includes('pool') ||
    lowerMessage.includes('gym')
  ) {
    return 'services';
  }

  if (
    lowerMessage.includes('loyalty') ||
    lowerMessage.includes('points') ||
    lowerMessage.includes('vip') ||
    lowerMessage.includes('reward')
  ) {
    return 'loyalty';
  }

  return 'general';
};

export const buildHotelContextForAdmin = async (): Promise<string> => {
  try {
    const Room = (await import('../../../models/Room')).default;
    const Booking = (await import('../../../models/Booking')).default;
    const Invoice = (await import('../../../models/Invoice')).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalRooms,
      occupiedRooms,
      availableRooms,
      todayCheckIns,
      pendingBookings,
    ] = await Promise.all([
      Room.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: true, status: 'occupied' }),
      Room.countDocuments({ isActive: true, status: 'available' }),
      Booking.countDocuments({
        checkIn: { $gte: today, $lte: todayEnd },
        status: 'confirmed',
      }),
      Booking.countDocuments({ status: 'pending' }),
    ]);

    const todayRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: today, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupiedRooms / totalRooms) * 100)
        : 0;

    return `
CURRENT HOTEL STATUS (${new Date().toLocaleDateString()}):
- Total Rooms: ${totalRooms}
- Occupied: ${occupiedRooms} (${occupancyRate}% occupancy)
- Available: ${availableRooms}
- Today's Check-ins: ${todayCheckIns}
- Pending Bookings: ${pendingBookings}
- Today's Revenue: ETB ${(todayRevenue[0]?.total || 0).toLocaleString()}
    `.trim();
  } catch {
    return 'Hotel context temporarily unavailable.';
  }
};

export const truncateConversationHistory = async (
  sessionId: string,
  maxMessages: number = 50
): Promise<void> => {
  const conversation = await AIConversation.findOne({ sessionId });

  if (!conversation) return;

  if (conversation.messages.length > maxMessages) {
    conversation.messages = conversation.messages.slice(-maxMessages);
    await conversation.save();
  }
};
