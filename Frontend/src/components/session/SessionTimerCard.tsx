import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Play, Navigation } from 'lucide-react';
import { sessionApi } from '@/api/session.api';
import type { SessionTicker } from '@/types/session';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SessionTimerCardProps {
  bookingId: string;
  isTrainer: boolean;
  bookingStatus: string;
  onStatusChange?: () => void;
}

export function SessionTimerCard({ bookingId, isTrainer, bookingStatus, onStatusChange }: SessionTimerCardProps) {
  const [ticker, setTicker] = useState<SessionTicker | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTicker() {
    try {
      const data = await sessionApi.getTicker(bookingId);
      setTicker(data);
      if (data?.remainingSeconds !== undefined) {
        setRemainingSeconds(data.remainingSeconds);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Poll server every 5 seconds to maintain authoritative sync
  useEffect(() => {
    fetchTicker();
    const serverSyncInterval = setInterval(fetchTicker, 5_000);
    return () => clearInterval(serverSyncInterval);
  }, [bookingId]);

  // Tick local timer every 1 second for a smooth display
  useEffect(() => {
    if (!ticker || ticker.isCompleted || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [ticker?.isCompleted, remainingSeconds]);

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      await sessionApi.start(bookingId);
      await fetchTicker();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOnTheWay() {
    setError(null);
    setLoading(true);
    try {
      await sessionApi.onTheWay(bookingId);
      onStatusChange?.();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setError(null);
    setLoading(true);
    try {
      await sessionApi.complete(bookingId);
      await fetchTicker();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if ((bookingStatus === 'CONFIRMED' || bookingStatus === 'ON_THE_WAY') && isTrainer) {
    return (
      <Card className="space-y-4 border-emerald-200 bg-emerald-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span>Workout Timer</span>
          </div>
          <Badge tone="emerald">Ready to Start</Badge>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-xs text-slate-600">Start session when you arrive at the residence.</p>
        {bookingStatus === 'CONFIRMED' && (
          <Button onClick={handleOnTheWay} loading={loading} variant="secondary" fullWidth>
            <Navigation className="h-4 w-4" /> Mark on the way
          </Button>
        )}
        <Button onClick={handleStart} loading={loading} fullWidth>
          <Play className="h-4 w-4" /> Start 60m Workout Session
        </Button>
      </Card>
    );
  }

  if (!ticker || !ticker.startedAt) return null;

  const is55Warning = remainingSeconds <= 300 && remainingSeconds > 0;

  return (
    <Card className={`space-y-4 transition ${is55Warning ? 'border-amber-300 bg-amber-50/50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Clock className="h-5 w-5 text-emerald-600" />
          <span>Live Session Timer</span>
        </div>
        <Badge tone={ticker.isCompleted ? 'slate' : is55Warning ? 'amber' : 'emerald'}>
          {ticker.isCompleted ? 'Completed' : 'In Progress'}
        </Badge>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {is55Warning && !ticker.isCompleted && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-100 p-3 text-xs font-semibold text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>55-Minute Buzzer! Session wrapping up in 5 minutes.</span>
        </div>
      )}

      <div className="py-2 text-center">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
          {formatTime(remainingSeconds)}
        </span>
        <p className="mt-1 text-xs text-slate-500">Authoritative Server Time</p>
      </div>

      {isTrainer && !ticker.isCompleted && (
        <Button onClick={handleComplete} loading={loading} variant="secondary" fullWidth>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Mark Session Completed
        </Button>
      )}
    </Card>
  );
}