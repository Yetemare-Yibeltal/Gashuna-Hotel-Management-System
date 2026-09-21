import { Check } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface Step {
  num: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center overflow-x-auto pb-2">
      {steps.map((s, idx) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={classNames(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
              currentStep > s.num
                ? 'bg-amber-600 border-amber-600 text-white'
                : currentStep === s.num
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-white/10 text-white/20 bg-transparent'
            )}>
              {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={classNames(
              'text-xs whitespace-nowrap',
              currentStep === s.num ? 'text-amber-400 font-medium' :
              currentStep > s.num ? 'text-white/50' : 'text-white/20'
            )}>
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={classNames(
              'w-10 sm:w-16 h-px mx-2 mb-5 transition-all',
              currentStep > s.num ? 'bg-amber-600' : 'bg-white/10'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
