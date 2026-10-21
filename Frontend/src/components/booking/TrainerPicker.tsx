import { User, Star } from 'lucide-react';
import type { EligibleTrainerInfo } from '@/types/availability';

interface TrainerPickerProps {
  trainers: EligibleTrainerInfo[];
  selectedTrainerId?: string;
  onSelectTrainer: (trainerId?: string) => void;
}

export function TrainerPicker({ trainers, selectedTrainerId, onSelectTrainer }: TrainerPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Preferred Trainer (Optional)</label>
        {selectedTrainerId && (
          <button
            type="button"
            onClick={() => onSelectTrainer(undefined)}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Clear preference (Auto-assign best)
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectTrainer(undefined)}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
            !selectedTrainerId
              ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <User className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Any Available Trainer</p>
            <p className="text-xs text-slate-500">Auto-assigned by closest distance & availability</p>
          </div>
        </button>

        {trainers.map((t) => {
          const isSelected = selectedTrainerId === t.trainerId;
          return (
            <button
              key={t.trainerId}
              type="button"
              onClick={() => onSelectTrainer(t.trainerId)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.distanceKm} km away</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{t.rating.toFixed(1)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}