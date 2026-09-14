import { formatETB, formatETBShort } from '../../lib/utils';
import { classNames } from '../../lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  short?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl font-bold',
};

export default function CurrencyDisplay({
  amount,
  short = false,
  className,
  size = 'md',
  showLabel = false,
}: CurrencyDisplayProps) {
  const formatted = short ? formatETBShort(amount) : formatETB(amount);
  return (
    <span className={classNames('font-semibold text-amber-400', sizes[size], className)}>
      {formatted}
      {showLabel && <span className="text-white/40 text-xs ml-1">incl. VAT</span>}
    </span>
  );
}
