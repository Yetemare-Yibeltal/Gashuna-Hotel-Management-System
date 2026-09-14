import { Calendar } from 'lucide-react';
import Input from './Input';
import { format } from 'date-fns';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  minDate?: string;
  label?: boolean;
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  label = true,
}: DateRangePickerProps) {
  const today = minDate || format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label={label ? 'Check-in' : undefined}
        type="date"
        value={checkIn}
        onChange={(e) => onCheckInChange(e.target.value)}
        min={today}
        leftIcon={<Calendar className="w-4 h-4" />}
      />
      <Input
        label={label ? 'Check-out' : undefined}
        type="date"
        value={checkOut}
        onChange={(e) => onCheckOutChange(e.target.value)}
        min={checkIn || tomorrow}
        leftIcon={<Calendar className="w-4 h-4" />}
      />
    </div>
  );
}
