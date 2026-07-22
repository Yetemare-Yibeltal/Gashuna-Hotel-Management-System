export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved',
} as const;

export const STAFF_STATUS = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
} as const;

export const HOUSEKEEPING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  INSPECTED: 'inspected',
  ISSUE_FOUND: 'issue_found',
} as const;

export const MAINTENANCE_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PAID: 'paid',
} as const;

export const SERVICE_REQUEST_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
