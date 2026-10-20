import { Check, Star, User } from 'lucide-react';
import type { CandidateEvaluation } from '@/types/availability';

interface TrainerPickerProps {
  candidates: CandidateEvaluation[];
  preferredTrainerId: string;
  onSelectTrainer: (trainerId: string) => void;
}

export function TrainerPicker({ candidates, preferredTrainerId, onSelectTrainer }: TrainerPickerProps) {
  const eligible = candidates.filter((c) => c.eligible);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Preferred Trainer (Optional)</label>
        <span className="text-xs text-slate-500">Auto-assigned if unselected</span>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelectTrainer('')}
          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition ${
            preferredTrainerId === ''
              ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Auto-assign best available trainer</span>
          {preferredTrainerId === '' && <Check className="h-4 w-4 text-emerald-600" />}
        </button>

        {eligible.map((c) => {
          const isSelected = preferredTrainerId === c.trainerId;

          return (
            <button
              key={c.trainerId}
              type="button"
              onClick={() => onSelectTrainer(c.trainerId)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{c.trainerName}</p>
                  <p className="text-[11px] text-slate-500">
                    {c.distanceKm} km away &bull; {c.sessionsToday} session(s) today
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {c.rating.toFixed(1)}
                </span>
                {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}