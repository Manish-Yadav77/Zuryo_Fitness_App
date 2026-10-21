import { formatTimeSlot } from '@/lib/time';
import type { TimeSlotOption } from '@/types/availability';
import { Badge } from '@/components/ui/Badge';

interface SlotGridProps {
  slots: TimeSlotOption[];
  selectedSlot: string | null;
  onSelectSlot: (slotIso: string) => void;
}

export function SlotGrid({ slots, selectedSlot, onSelectSlot }: SlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
        No trainers are available for this date. Try picking another date or society.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((s) => {
        const isSelected = selectedSlot === s.startAt;
        return (
          <button
            key={s.startAt}
            type="button"
            onClick={() => onSelectSlot(s.startAt)}
            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
              isSelected
                ? 'border-emerald-600 bg-emerald-600 text-white font-semibold'
                : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
          >
            <span className="text-sm font-medium">{formatTimeSlot(s.startAt)}</span>
            <span className={`mt-1 text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
              {s.availableTrainersCount} trainer{s.availableTrainersCount > 1 ? 's' : ''}
            </span>
            {s.hasPreferredTrainer && (
              <span className="mt-1">
                <Badge tone={isSelected ? 'emerald' : 'amber'}>Preferred</Badge>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}