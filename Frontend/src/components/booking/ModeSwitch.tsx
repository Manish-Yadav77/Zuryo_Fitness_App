import { Calendar, Zap } from 'lucide-react';
import type { BookingMode } from '@/types/booking';

interface ModeSwitchProps {
  mode: BookingMode;
  onChange: (mode: BookingMode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('INSTANT')}
        className={`flex items-center justify-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium transition ${
          mode === 'INSTANT'
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Zap className="h-4 w-4 text-emerald-600" />
        <span>Instant (starts within 60 min)</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('SCHEDULED')}
        className={`flex items-center justify-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium transition ${
          mode === 'SCHEDULED'
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Calendar className="h-4 w-4 text-emerald-600" />
        <span>Schedule for later</span>
      </button>
    </div>
  );
}