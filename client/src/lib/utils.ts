import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';

export const formatETB = (amount: number): string => {
  return `ETB ${(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatETBShort = (amount: number): string => {
  if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(1)}K`;
  return `ETB ${(amount || 0).toLocaleString('en-US')}`;
};

const toDate = (date: string | Date): Date =>
  typeof date === 'string' ? parseISO(date) : date;

export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  return format(toDate(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  return format(toDate(date), 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  if (!date) return '-';
  return format(toDate(date), 'HH:mm');
};

export const timeAgo = (date: string | Date): string => {
  if (!date) return '-';
  return formatDistanceToNow(toDate(date), { addSuffix: true });
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, differenceInDays(parseISO(checkOut), parseISO(checkIn)));
};

export const calculateVAT = (amount: number, vatRate = 0.15): number =>
  Math.round(amount * vatRate * 100) / 100;

export const calculateTotal = (subtotal: number, vatRate = 0.15): number =>
  Math.round(subtotal * (1 + vatRate) * 100) / 100;

export const buildPriceSummary = (subtotal: number, vatRate = 0.15) => {
  const vatAmount = calculateVAT(subtotal, vatRate);
  const total = subtotal + vatAmount;
  return {
    subtotal,
    vatAmount,
    total,
    subtotalFormatted: formatETB(subtotal),
    vatAmountFormatted: formatETB(vatAmount),
    totalFormatted: formatETB(total),
  };
};

const GRAY = 'text-gray-400 bg-gray-400/10';

export const getRoomStatusColor = (status: string): string =>
  ({
    available: 'text-emerald-400 bg-emerald-400/10',
    occupied: 'text-red-400 bg-red-400/10',
    cleaning: 'text-amber-400 bg-amber-400/10',
    maintenance: 'text-blue-400 bg-blue-400/10',
    reserved: 'text-purple-400 bg-purple-400/10',
  } as Record<string, string>)[status] || GRAY;

export const getBookingStatusColor = (status: string): string =>
  ({
    pending: 'text-amber-400 bg-amber-400/10',
    confirmed: 'text-blue-400 bg-blue-400/10',
    checked_in: 'text-emerald-400 bg-emerald-400/10',
    checked_out: GRAY,
    cancelled: 'text-red-400 bg-red-400/10',
    no_show: 'text-orange-400 bg-orange-400/10',
  } as Record<string, string>)[status] || GRAY;

export const getPaymentStatusColor = (status: string): string =>
  ({
    unpaid: 'text-red-400 bg-red-400/10',
    partial: 'text-amber-400 bg-amber-400/10',
    paid: 'text-emerald-400 bg-emerald-400/10',
    refunded: 'text-blue-400 bg-blue-400/10',
  } as Record<string, string>)[status] || GRAY;

export const getInvoiceStatusColor = (status: string): string =>
  ({
    draft: GRAY,
    issued: 'text-blue-400 bg-blue-400/10',
    paid: 'text-emerald-400 bg-emerald-400/10',
    overdue: 'text-red-400 bg-red-400/10',
    cancelled: GRAY,
  } as Record<string, string>)[status] || GRAY;

export const getPriorityColor = (priority: string): string =>
  ({
    low: GRAY,
    normal: 'text-blue-400 bg-blue-400/10',
    high: 'text-amber-400 bg-amber-400/10',
    urgent: 'text-red-400 bg-red-400/10',
    critical: 'text-red-500 bg-red-500/20',
  } as Record<string, string>)[priority] || GRAY;

export const getOccupancyColor = (rate: number): string => {
  if (rate >= 80) return 'text-emerald-400';
  if (rate >= 60) return 'text-amber-400';
  if (rate >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export const truncate = (text: string, length = 50): string => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
};

export const generateInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const classNames = (
  ...classes: (string | undefined | false | null)[]
): string => classes.filter(Boolean).join(' ');

export const downloadJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  return phone.startsWith('+251') ? phone : `+251${phone.replace(/^0/, '')}`;
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^(\+251|0)?[79]\d{8}$/.test(phone.replace(/\s/g, ''));

export const getFileExtension = (filename: string): string =>
  filename.split('.').pop()?.toLowerCase() || '';

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
