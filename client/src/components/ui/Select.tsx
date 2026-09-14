import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={classNames('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-white/70">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={classNames(
              'w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all duration-200 text-sm appearance-none cursor-pointer',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-white/20 focus:border-amber-500 focus:ring-amber-500/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-neutral-900">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-neutral-900">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
