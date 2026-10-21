import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CalendarOff,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { trainerApi } from '@/api/trainer.api';
import type { TimeOff, WeeklySlot } from '@/types/trainer';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function format12H(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

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
    trainerApi
      .getMine()
      .then((p) => {
        setWeekly(p.weeklyAvailability || []);
        setTimeOff(p.timeOff || []);
      })
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  function handleAddWindow() {
    setError(null);
    if (newStart >= newEnd) {
      setError('Start time must be strictly before end time.');
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
      setWeekly(p.weeklyAvailability || []);
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
      setError('Provide both start and end date/time for time off.');
      return;
    }
    setError(null);
    setSuccess(null);
    setAddingTf(true);
    try {
      const p = await trainerApi.addTimeOff(
        new Date(tfFrom).toISOString(),
        new Date(tfTo).toISOString(),
        tfReason
      );
      setTimeOff(p.timeOff || []);
      setTfFrom('');
      setTfTo('');
      setTfReason('');
      setSuccess('Time-off block added successfully.');
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
      setTimeOff(p.timeOff || []);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading schedule...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Schedule Management
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Manage Availability
        </h1>
        <p className="text-sm text-slate-500">
          Set recurring working windows and add time-off exceptions.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-6">
          <Alert tone="success">{success}</Alert>
        </div>
      )}

      {/* Card 1: Recurring Weekly Windows */}
      <Card className="mb-8 p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recurring Weekly Windows
            </h2>
            <p className="text-xs text-slate-500">
              Define the days and hours you are available to conduct workout sessions.
            </p>
          </div>
        </div>

        {/* Add Window Form Bar */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Add New Working Window
          </span>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[130px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Day of Week
              </label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-emerald-500"
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Start Time
              </label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                End Time
              </label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddWindow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Add Window
            </button>
          </div>
        </div>

        {/* Existing Windows List */}
        <form onSubmit={handleSaveSchedule} className="mt-6 space-y-5">
          {weekly.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
              No working hours defined yet. Add a window above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              <span className="block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Configured Windows ({weekly.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {weekly.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-24 rounded-md bg-slate-100 px-2.5 py-1 text-center font-bold text-slate-800">
                        {DAY_NAMES[w.weekday]}
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          {format12H(w.start)} – {format12H(w.end)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWindow(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Remove Window"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={saving}
              className="w-full sm:w-auto px-6 font-bold text-xs"
            >
              Save Weekly Schedule
            </Button>
          </div>
        </form>
      </Card>

      {/* Card 2: Time-Off Exceptions */}
      <Card className="p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CalendarOff className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Time-Off Exceptions
            </h2>
            <p className="text-xs text-slate-500">
              Block specific dates or hours when you won't be available for bookings.
            </p>
          </div>
        </div>

        {/* Add Time-Off Form */}
        <form
          onSubmit={handleAddTimeOff}
          className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 transition-all"
        >
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Block Out Time Off
          </span>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                From
              </label>
              <input
                type="datetime-local"
                value={tfFrom}
                onChange={(e) => setTfFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                To
              </label>
              <input
                type="datetime-local"
                value={tfTo}
                onChange={(e) => setTfTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="min-w-[200px] flex-[2]">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Personal leave, Doctor appointment"
                value={tfReason}
                onChange={(e) => setTfReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              loading={addingTf}
              className="bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Block Time Off
            </Button>
          </div>
        </form>

        {/* Time-Off List */}
        <div className="mt-6 space-y-2">
          <span className="block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Blocked Time Off ({timeOff.length})
          </span>

          {timeOff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
              No upcoming time off blocked.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {timeOff.map((to) => (
                <div
                  key={to._id}
                  className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>
                        {new Date(to.from).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        —{' '}
                        {new Date(to.to).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {to.reason && (
                      <p className="pl-5 text-xs font-medium text-slate-500">
                        Reason: {to.reason}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTimeOff(to._id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Delete Time Off"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}