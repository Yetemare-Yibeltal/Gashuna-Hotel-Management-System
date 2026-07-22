export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
} as const;

export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_rooms',
    'manage_bookings',
    'manage_guests',
    'manage_staff',
    'manage_payroll',
    'manage_inventory',
    'manage_menu',
    'manage_services',
    'manage_invoices',
    'manage_payments',
    'manage_reports',
    'manage_settings',
    'view_audit_logs',
    'manage_housekeeping',
    'manage_maintenance',
  ],
  manager: [
    'manage_rooms',
    'manage_bookings',
    'manage_guests',
    'manage_staff',
    'manage_inventory',
    'manage_menu',
    'manage_services',
    'manage_invoices',
    'manage_payments',
    'manage_reports',
    'manage_housekeeping',
    'manage_maintenance',
  ],
  receptionist: [
    'view_rooms',
    'manage_bookings',
    'manage_guests',
    'manage_checkins',
    'view_invoices',
    'manage_food_orders',
    'manage_housekeeping',
    'view_notifications',
  ],
} as const;

export const ALL_ROLES = Object.values(ROLES);
