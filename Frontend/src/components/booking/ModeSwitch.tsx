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
        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
          mode === 'INSTANT'
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-600/30'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Zap className="h-6 w-6 text-emerald-600" />
        <div>
          <span className="block text-sm font-semibold">Instant Booking</span>
          <span className="text-xs font-normal text-slate-500">Start within 60 mins</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange('SCHEDULED')}
        className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
          mode === 'SCHEDULED'
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-600/30'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Calendar className="h-6 w-6 text-emerald-600" />
        <div>
          <span className="block text-sm font-semibold">Scheduled Booking</span>
          <span className="text-xs font-normal text-slate-500">Pick a future date & slot</span>
        </div>
      </button>
    </div>
  );
}