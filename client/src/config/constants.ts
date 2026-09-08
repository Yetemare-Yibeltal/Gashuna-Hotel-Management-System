export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const HOTEL = {
  name: 'Gashuna Hotel',
  nameAmharic: 'ጋሹና ሆቴል',
  address: 'Dangila Kebele 05, End of Addis Kedam Exit, Dangla, Awi Zone, Amhara Region, Ethiopia',
  addressAmharic: 'ዳንግላ ቀበሌ 05፣ አዲስ ቀዳም መውጫ መጨረሻ፣ ዳንግላ፣ አዊ ዞን፣ አማራ ክልል፣ ኢትዮጵያ',
  email: 'gashunayene@gashuna.com',
  website: 'https://gashuna.com',
  phone: import.meta.env.VITE_HOTEL_PHONE || '',
  currency: 'ETB',
  currencySymbol: 'ETB',
  vatRate: 0.15,
  vatRatePercent: '15%',
  loyaltyPointsPerETB: 1,
  loyaltyETBPerPoint: 100,
  vipThreshold: 50000,
};

export const ROOM_TYPES = {
  standard: { label: 'Standard Room', labelAm: 'መደበኛ ክፍል', color: 'blue' },
  deluxe: { label: 'Deluxe Room', labelAm: 'ድሉክስ ክፍል', color: 'purple' },
  junior_suite: { label: 'Junior Suite', labelAm: 'ጁኒየር ሱይት', color: 'amber' },
  suite: { label: 'Presidential Suite', labelAm: 'ፕሬዚዳንታዊ ሱይት', color: 'gold' },
};

export const ROOM_STATUS = {
  available: { label: 'Available', color: 'emerald', dot: 'status-available' },
  occupied: { label: 'Occupied', color: 'red', dot: 'status-occupied' },
  cleaning: { label: 'Cleaning', color: 'amber', dot: 'status-cleaning' },
  maintenance: { label: 'Maintenance', color: 'blue', dot: 'status-maintenance' },
  reserved: { label: 'Reserved', color: 'purple', dot: 'status-reserved' },
};

export const BOOKING_STATUS = {
  pending: { label: 'Pending', color: 'amber' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  checked_in: { label: 'Checked In', color: 'emerald' },
  checked_out: { label: 'Checked Out', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
  no_show: { label: 'No Show', color: 'orange' },
};

export const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: 'red' },
  partial: { label: 'Partial', color: 'amber' },
  paid: { label: 'Paid', color: 'emerald' },
  refunded: { label: 'Refunded', color: 'blue' },
};

export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: '💵' },
  telebirr: { label: 'Telebirr', icon: '📱' },
  cbe_birr: { label: 'CBE Birr', icon: '🏦' },
  chapa: { label: 'Chapa', icon: '💳' },
  card: { label: 'Card', icon: '💳' },
  bank_transfer: { label: 'Bank Transfer', icon: '🏛️' },
};

export const DEPARTMENTS = {
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  restaurant: 'Restaurant',
  kitchen: 'Kitchen',
  maintenance: 'Maintenance',
  security: 'Security',
  management: 'Management',
  accounting: 'Accounting',
};

export const MENU_CATEGORIES = {
  breakfast: { label: 'Breakfast', icon: '🌅' },
  mains: { label: 'Main Courses', icon: '🍽️' },
  drinks: { label: 'Drinks', icon: '☕' },
  appetizers: { label: 'Appetizers', icon: '🥗' },
  desserts: { label: 'Desserts', icon: '🍰' },
};

export const SERVICE_CATEGORIES = {
  transport: { label: 'Transport', icon: '🚗' },
  tour: { label: 'Tours', icon: '🏔️' },
  laundry: { label: 'Laundry', icon: '👕' },
  spa: { label: 'Spa', icon: '💆' },
  conference: { label: 'Conference', icon: '🏛️' },
  recreation: { label: 'Recreation', icon: '🏊' },
  business: { label: 'Business', icon: '💼' },
  other: { label: 'Other', icon: '⭐' },
};

export const INVENTORY_CATEGORIES = {
  kitchen: { label: 'Kitchen', icon: '🍳' },
  housekeeping: { label: 'Housekeeping', icon: '🧹' },
  bar: { label: 'Bar', icon: '🍺' },
  maintenance: { label: 'Maintenance', icon: '🔧' },
  office: { label: 'Office', icon: '📎' },
  amenities: { label: 'Amenities', icon: '🛁' },
};

export const PAGINATION = {
  defaultLimit: 20,
  limitOptions: [10, 20, 50, 100],
};

export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const LOCAL_ATTRACTIONS = [
  {
    name: 'Blue Nile Gorge',
    nameAm: 'አባይ ጎርጅ',
    distance: '2 hours away',
    description: 'One of Ethiopia\'s most spectacular natural wonders',
    icon: '🏔️',
  },
  {
    name: 'Lake Tana',
    nameAm: 'ጣና ሐይቅ',
    distance: '3 hours away',
    description: 'Source of the Blue Nile with ancient island monasteries',
    icon: '🌊',
  },
  {
    name: 'Tis Abay Falls',
    nameAm: 'ጢስ አባይ',
    distance: '3.5 hours away',
    description: 'The magnificent Blue Nile Falls',
    icon: '💧',
  },
  {
    name: 'Chara Forest',
    nameAm: 'ቻራ ጫካ',
    distance: '30 minutes away',
    description: 'Beautiful indigenous highland forest',
    icon: '🌲',
  },
];
