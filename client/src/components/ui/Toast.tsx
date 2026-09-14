import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export const showSuccess = (message: string) => {
  toast.custom((t) => (
    <div className={`flex items-center gap-3 bg-neutral-900 border border-emerald-500/30 rounded-xl px-4 py-3 shadow-xl ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>
  ));
};

export const showError = (message: string) => {
  toast.custom((t) => (
    <div className={`flex items-center gap-3 bg-neutral-900 border border-red-500/30 rounded-xl px-4 py-3 shadow-xl ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>
  ));
};

export const showWarning = (message: string) => {
  toast.custom((t) => (
    <div className={`flex items-center gap-3 bg-neutral-900 border border-amber-500/30 rounded-xl px-4 py-3 shadow-xl ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>
  ));
};

export const showInfo = (message: string) => {
  toast.custom((t) => (
    <div className={`flex items-center gap-3 bg-neutral-900 border border-blue-500/30 rounded-xl px-4 py-3 shadow-xl ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
      <Info className="w-5 h-5 text-blue-400 shrink-0" />
      <p className="text-sm text-white">{message}</p>
    </div>
  ));
};

export default { showSuccess, showError, showWarning, showInfo };
