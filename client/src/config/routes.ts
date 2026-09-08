export const PUBLIC_ROUTES = {
  HOME: '/',
  ROOMS: '/rooms',
  ROOM_DETAIL: '/rooms/:id',
  BOOKING: '/booking',
  RESTAURANT: '/restaurant',
  SERVICES: '/services',
  GALLERY: '/gallery',
  ABOUT: '/about',
  CONTACT: '/contact',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAILED: '/payment/failed',
  NOT_FOUND: '*',
};

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin',
  RESERVATIONS: '/admin/reservations',
  ROOMS: '/admin/rooms',
  GUESTS: '/admin/guests',
  BILLING: '/admin/billing',
  STAFF: '/admin/staff',
  REPORTS: '/admin/reports',
  INVENTORY: '/admin/inventory',
  SETTINGS: '/admin/settings',
  HOUSEKEEPING: '/admin/housekeeping',
  MAINTENANCE: '/admin/maintenance',
  FOOD_ORDERS: '/admin/food-orders',
  SERVICES: '/admin/services',
  PAYROLL: '/admin/payroll',
  AUDIT_LOGS: '/admin/audit-logs',
  AI_ASSISTANT: '/admin/ai',
  AI_PREDICTIONS: '/admin/ai/predictions',
};

export const getAdminRouteLabel = (route: string): string => {
  const labels: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/reservations': 'Reservations',
    '/admin/rooms': 'Rooms',
    '/admin/guests': 'Guests',
    '/admin/billing': 'Billing',
    '/admin/staff': 'Staff',
    '/admin/reports': 'Reports',
    '/admin/inventory': 'Inventory',
    '/admin/settings': 'Settings',
    '/admin/housekeeping': 'Housekeeping',
    '/admin/maintenance': 'Maintenance',
    '/admin/food-orders': 'Food Orders',
    '/admin/services': 'Services',
    '/admin/payroll': 'Payroll',
    '/admin/audit-logs': 'Audit Logs',
    '/admin/ai': 'AI Assistant',
    '/admin/ai/predictions': 'AI Predictions',
  };
  return labels[route] || 'Page';
};
