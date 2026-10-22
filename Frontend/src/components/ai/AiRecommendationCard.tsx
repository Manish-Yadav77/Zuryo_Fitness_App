import { useState } from 'react';
import { Bot, CheckCircle, Dumbbell, Sparkles, Heart } from 'lucide-react';
import { recordApi } from '@/api/record.api';
import type { AiWorkoutRecommendation } from '@/types/record';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function AiRecommendationCard() {
  const [recommendation, setRecommendation] = useState<AiWorkoutRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      let data: AiWorkoutRecommendation;
      try {
        data = await recordApi.getAiRecommendation();
      } catch (first) {
        // One silent retry for network blips / server restart (tsx watch, Render wake-up).
        const parsed = parseApiError(first);
        if (parsed.code === 'NETWORK_ERROR' || parsed.code === 'TIMEOUT') {
          await new Promise((r) => setTimeout(r, 2000));
          data = await recordApi.getAiRecommendation();
        } else {
          throw first;
        }
      }
      setRecommendation(data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4 border-emerald-200 bg-linear-to-br from-emerald-50/50 to-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Workout Coach</h2>
            <p className="text-xs text-slate-500">Personalized routine tailored to your goals & history.</p>
          </div>
        </div>
        <Badge tone="emerald">
          {recommendation ? `${recommendation.source} (${recommendation.latencyMs}ms)` : 'Multi-provider AI'}
        </Badge>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <p className="text-center text-xs text-slate-500">Generating your plan… this can take up to 30 seconds.</p>}

      {!recommendation ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-600 mb-4">
            Generates a tailored 60-minute workout from your fitness profile and past sessions.
          </p>
          <Button onClick={handleGenerate} loading={loading}>
            <Bot className="h-4 w-4" /> Generate AI Recommendation
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="rounded-xl bg-white p-4 shadow-xs border border-emerald-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{recommendation.workoutTitle}</h3>
              <Badge tone="sky">{recommendation.focusArea}</Badge>
            </div>
            <p className="mt-2 text-xs italic text-slate-600">"{recommendation.coachNote}"</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Warm-Up
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {recommendation.warmUp.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-600" /> Main Circuit
              </span>
              <ul className="space-y-1 text-slate-600">
                {recommendation.mainCircuit.map((m, i) => (
                  <li key={i} className="flex justify-between border-b border-slate-100 pb-1">
                    <span>{m.exercise}</span>
                    <span className="font-semibold text-slate-900">{m.sets}x{m.reps}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                <Heart className="h-3.5 w-3.5 text-teal-600" /> Cool-Down
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {recommendation.coolDown.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <Button onClick={handleGenerate} variant="secondary" fullWidth loading={loading}>
            Refresh Recommendation
          </Button>
        </div>
      )}
    </Card>
  );
}