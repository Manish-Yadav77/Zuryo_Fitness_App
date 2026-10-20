import { Clock } from 'lucide-react';
import type { TimeSlotOption } from '@/types/availability';
import { Badge } from '@/components/ui/Badge';

interface SlotGridProps {
  slots: TimeSlotOption[];
  selectedSlot: string;
  onSelectSlot: (slotIso: string) => void;
}

export function SlotGrid({ slots, selectedSlot, onSelectSlot }: SlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No available time slots found for this selection. Try picking another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.startAt;
        const isAvailable = slot.availableTrainersCount > 0;

        return (
          <button
            key={slot.startAt}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelectSlot(slot.startAt)}
            className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
              isSelected
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/30'
                : isAvailable
                ? 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-100 bg-slate-50/60 text-slate-400'
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold">{slot.label}</span>
              {slot.isPeak && <Badge tone="amber">Peak</Badge>}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{isAvailable ? `${slot.availableTrainersCount} trainer(s) free` : 'Fully Booked'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}