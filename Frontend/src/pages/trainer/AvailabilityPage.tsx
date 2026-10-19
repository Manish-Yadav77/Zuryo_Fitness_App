import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarOff, Clock, Plus, Trash2 } from 'lucide-react';
import { trainerApi } from '@/api/trainer.api';
import type { TimeOff, WeeklySlot } from '@/types/trainer';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  const [weekly, setWeekly] = useState<WeeklySlot[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);

  const [newDay, setNewDay] = useState<number>(1);
  const [newStart, setNewStart] = useState('06:00');
  const [newEnd, setNewEnd] = useState('12:00');

  const [tfFrom, setTfFrom] = useState('');
  const [tfTo, setTfTo] = useState('');
  const [tfReason, setTfReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingTf, setAddingTf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    trainerApi.getMine()
      .then((p) => {
        setWeekly(p.weeklyAvailability);
        setTimeOff(p.timeOff);
      })
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  function handleAddWindow() {
    setError(null);
    if (newStart >= newEnd) {
      setError('Start time must be strictly before end time');
      return;
    }
    const updated = [...weekly, { weekday: newDay, start: newStart, end: newEnd }];
    setWeekly(updated);
  }

  function handleRemoveWindow(index: number) {
    setWeekly(weekly.filter((_, i) => i !== index));
  }

  async function handleSaveSchedule(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const p = await trainerApi.updateAvailability(weekly);
      setWeekly(p.weeklyAvailability);
      setSuccess('Weekly schedule updated successfully.');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTimeOff(e: FormEvent) {
    e.preventDefault();
    if (!tfFrom || !tfTo) {
      setError('Provide both start and end time for time off');
      return;
    }
    setError(null);
    setSuccess(null);
    setAddingTf(true);
    try {
      const p = await trainerApi.addTimeOff(new Date(tfFrom).toISOString(), new Date(tfTo).toISOString(), tfReason);
      setTimeOff(p.timeOff);
      setTfFrom('');
      setTfTo('');
      setTfReason('');
      setSuccess('Time-off block added.');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setAddingTf(false);
    }
  }

  async function handleDeleteTimeOff(id?: string) {
    if (!id) return;
    try {
      const p = await trainerApi.deleteTimeOff(id);
      setTimeOff(p.timeOff);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading schedule...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Availability</h1>
        <p className="text-sm text-slate-500">Set recurring working windows and add time-off exceptions.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card>
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Clock className="h-5 w-5 text-emerald-600" />
          Recurring Weekly Windows
        </h2>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Day</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            >
              {DAY_NAMES.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleAddWindow}>
            <Plus className="h-4 w-4" /> Add Window
          </Button>
        </div>

        <form onSubmit={handleSaveSchedule} className="mt-6 space-y-4">
          {weekly.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No working hours defined. Add a window above.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {weekly.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-slate-900">{DAY_NAMES[w.weekday]}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">{w.start} - {w.end}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWindow(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" loading={saving} fullWidth>
            Save Weekly Schedule
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <CalendarOff className="h-5 w-5 text-amber-600" />
          Time-Off Exceptions
        </h2>

        <form onSubmit={handleAddTimeOff} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-amber-50/50 p-4 ring-1 ring-amber-200/60">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
            <input
              type="datetime-local"
              value={tfFrom}
              onChange={(e) => setTfFrom(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
            <input
              type="datetime-local"
              value={tfTo}
              onChange={(e) => setTfTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex-1 min-w-50">
            <label className="mb-1 block text-xs font-medium text-slate-600">Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Doctor appointment"
              value={tfReason}
              onChange={(e) => setTfReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <Button type="submit" loading={addingTf}>
            Block Time Off
          </Button>
        </form>

        <div className="mt-6 divide-y divide-slate-100">
          {timeOff.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No upcoming time off blocked.</p>
          ) : (
            timeOff.map((to) => (
              <div key={to._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(to.from).toLocaleString()} - {new Date(to.to).toLocaleString()}
                  </p>
                  {to.reason && <p className="text-xs text-slate-500">{to.reason}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTimeOff(to._id)}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}