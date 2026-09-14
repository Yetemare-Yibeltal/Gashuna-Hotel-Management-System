import { classNames } from '../../lib/utils';

interface StatusDotProps {
  status: string;
  type?: 'room' | 'booking' | 'payment' | 'staff' | 'maintenance';
  showLabel?: boolean;
}

const roomColors: Record<string, string> = {
  available: 'bg-emerald-400',
  occupied: 'bg-red-400',
  cleaning: 'bg-amber-400',
  maintenance: 'bg-blue-400',
  reserved: 'bg-purple-400',
};

const bookingColors: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  checked_in: 'bg-emerald-400',
  checked_out: 'bg-gray-400',
  cancelled: 'bg-red-400',
  no_show: 'bg-orange-400',
};

const paymentColors: Record<string, string> = {
  unpaid: 'bg-red-400',
  partial: 'bg-amber-400',
  paid: 'bg-emerald-400',
  refunded: 'bg-blue-400',
};

const staffColors: Record<string, string> = {
  active: 'bg-emerald-400',
  on_leave: 'bg-amber-400',
  terminated: 'bg-red-400',
};

const maintenanceColors: Record<string, string> = {
  open: 'bg-red-400',
  assigned: 'bg-blue-400',
  in_progress: 'bg-amber-400',
  resolved: 'bg-emerald-400',
  closed: 'bg-gray-400',
  cancelled: 'bg-gray-400',
};

const getColor = (status: string, type?: string): string => {
  if (type === 'room') return roomColors[status] || 'bg-gray-400';
  if (type === 'booking') return bookingColors[status] || 'bg-gray-400';
  if (type === 'payment') return paymentColors[status] || 'bg-gray-400';
  if (type === 'staff') return staffColors[status] || 'bg-gray-400';
  if (type === 'maintenance') return maintenanceColors[status] || 'bg-gray-400';
  return roomColors[status] || bookingColors[status] || 'bg-gray-400';
};

export default function StatusDot({ status, type, showLabel = false }: StatusDotProps) {
  const color = getColor(status, type);
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={classNames('w-2 h-2 rounded-full', color)} />
      {showLabel && <span className="text-sm text-white/70">{label}</span>}
    </span>
  );
}
