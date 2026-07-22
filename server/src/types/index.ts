export type UserRole = 'admin' | 'manager' | 'receptionist';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export type PaymentMethod =
  | 'cash'
  | 'telebirr'
  | 'cbe_birr'
  | 'chapa'
  | 'card'
  | 'bank_transfer';

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'reserved';

export type RoomType = 'standard' | 'deluxe' | 'junior_suite' | 'suite';

export type StaffStatus = 'active' | 'on_leave' | 'terminated';

export type StaffDepartment =
  | 'front_desk'
  | 'housekeeping'
  | 'restaurant'
  | 'kitchen'
  | 'maintenance'
  | 'security'
  | 'management'
  | 'accounting';

export type NotificationEvent =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'CHECKIN_DUE'
  | 'CHECKOUT_DUE'
  | 'CHECKIN_COMPLETED'
  | 'CHECKOUT_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'LOW_STOCK'
  | 'HOUSEKEEPING_DONE'
  | 'HOUSEKEEPING_OVERDUE'
  | 'MAINTENANCE_OPEN'
  | 'MAINTENANCE_URGENT'
  | 'MAINTENANCE_RESOLVED'
  | 'VIP_ARRIVAL'
  | 'ROOM_AVAILABLE'
  | 'INVOICE_OVERDUE'
  | 'STAFF_ABSENT'
  | 'GENERAL';

export interface PaginationResult<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: 'ETB';
}
