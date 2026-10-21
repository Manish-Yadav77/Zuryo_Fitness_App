import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Percent,
  Save,
  Plus,
  Trash2,
  Clock,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { pricingApi } from '@/api/pricing.api';
import type { PricingConfig } from '@/types/pricing';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const WEEKDAYS = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
];

function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStrToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesTo12H(mins: number): string {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [normalRupees, setNormalRupees] = useState('399');
  const [peakRupees, setPeakRupees] = useState('499');
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [peakWindows, setPeakWindows] = useState<PricingConfig['peakWindows']>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    pricingApi
      .getConfig()
      .then((cfg) => {
        setConfig(cfg);
        setNormalRupees((cfg.normalPaise / 100).toString());
        setPeakRupees((cfg.peakPaise / 100).toString());
        setCommissionPercent(cfg.commissionPercent.toString());
        setPeakWindows(cfg.peakWindows || []);
      })
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const normalPaise = Math.round(parseFloat(normalRupees) * 100);
      const peakPaise = Math.round(parseFloat(peakRupees) * 100);
      const comm = parseFloat(commissionPercent);

      if (isNaN(normalPaise) || isNaN(peakPaise) || isNaN(comm)) {
        throw new Error('Please enter valid numeric pricing values.');
      }

      const updated = await pricingApi.updateConfig({
        normalPaise,
        peakPaise,
        commissionPercent: comm,
        peakWindows,
      });

      setConfig(updated);
      setSuccess(
        `Pricing rules updated successfully! New quotes will use version ${updated.version}`
      );
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  const toggleDayInWindow = (windowIndex: number, dayVal: number) => {
    setPeakWindows((all) =>
      all.map((w, idx) => {
        if (idx !== windowIndex) return w;
        const exists = w.weekdays.includes(dayVal);
        const updatedDays = exists
          ? w.weekdays.filter((d) => d !== dayVal)
          : [...w.weekdays, dayVal].sort((a, b) => a - b);
        return { ...w, weekdays: updatedDays };
      })
    );
  };

  const addPeakWindow = () => {
    setPeakWindows((v) => [
      ...v,
      { weekdays: [1, 2, 3, 4, 5], startMinute: 1020, endMinute: 1260 },
    ]);
  };

  const removePeakWindow = (index: number) => {
    setPeakWindows((all) => all.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading pricing rules...
      </div>
    );
  }

  const normalBase = parseFloat(normalRupees) || 0;
  const peakBase = parseFloat(peakRupees) || 0;
  const commRate = parseFloat(commissionPercent) || 0;

  const normalCut = (normalBase * commRate) / 100;
  const normalTotal = normalBase + normalCut;

  const peakCut = (peakBase * commRate) / 100;
  const peakTotal = peakBase + peakCut;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            System Configuration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pricing Rules & Commissions
          </h1>
          <p className="text-sm text-slate-500">
            Configure base rates, peak multipliers, and residence splits.
          </p>
        </div>
        {config && (
          <div className="self-start sm:self-center">
            <Badge tone="emerald">Active Rules v{config.version}</Badge>
          </div>
        )}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Session Rates */}
        <Card className="p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Base Session Pricing Rates
              </h2>
              <p className="text-xs text-slate-500">
                Set base customer pricing and platform fee split.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="Normal Slot Base (₹)"
              type="number"
              value={normalRupees}
              onChange={(e) => setNormalRupees(e.target.value)}
              placeholder="399"
              required
            />

            <Input
              label="Peak Slot Base (₹)"
              type="number"
              value={peakRupees}
              onChange={(e) => setPeakRupees(e.target.value)}
              placeholder="499"
              required
            />

            <Input
              label="Society Cut (%)"
              type="number"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="10"
              required
            />
          </div>
        </Card>

        {/* Card 2: Peak Windows */}
        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Peak Time Windows
                </h2>
                <p className="text-xs text-slate-500">
                  Slots falling within these time ranges automatically trigger peak rates.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={addPeakWindow}
              className="inline-flex self-start sm:self-auto items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" /> Add Peak Window
            </Button>
          </div>

          {peakWindows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
              No peak windows configured yet. Click above to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {peakWindows.map((window, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-start">
                    {/* Active Days Selector */}
                    <div className="shrink-0 space-y-1.5">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Active Days
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((day) => {
                          const isSelected = window.weekdays.includes(day.val);
                          return (
                            <button
                              key={day.val}
                              type="button"
                              onClick={() => toggleDayInWindow(index, day.val)}
                              className={`flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Inputs & Trash Action */}
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Start Time
                        </span>
                        <input
                          type="time"
                          value={minutesToTimeStr(window.startMinute)}
                          onChange={(e) => {
                            const mins = timeStrToMinutes(e.target.value);
                            setPeakWindows((all) =>
                              all.map((w, i) =>
                                i === index ? { ...w, startMinute: mins } : w
                              )
                            );
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <span className="mb-2 text-xs font-semibold text-slate-400">
                        to
                      </span>

                      <div>
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          End Time
                        </span>
                        <input
                          type="time"
                          value={minutesToTimeStr(window.endMinute)}
                          onChange={(e) => {
                            const mins = timeStrToMinutes(e.target.value);
                            setPeakWindows((all) =>
                              all.map((w, i) =>
                                i === index ? { ...w, endMinute: mins } : w
                              )
                            );
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removePeakWindow(index)}
                        className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Remove Window"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Readable Summary Helper */}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/60 pt-2 text-[11px] font-medium text-slate-500">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>
                      Window: {formatMinutesTo12H(window.startMinute)} –{' '}
                      {formatMinutesTo12H(window.endMinute)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Card 3: Live Preview Breakdown */}
        <Card className="bg-gradient-to-br from-slate-50 to-emerald-50/20 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Rate Calculation Preview
            </h3>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2">
            {/* Normal Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Normal Slot Quote</span>
                <Badge tone="slate">Standard</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span className="font-medium text-slate-900">
                    ₹{normalBase.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Society Share ({commRate}%):</span>
                  <span>+ ₹{normalCut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-emerald-600">
                  <span>Total Customer Rate:</span>
                  <span>₹{normalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Peak Breakdown */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-bold text-slate-900">Peak Slot Quote</span>
                <Badge tone="amber">Peak Rate</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span className="font-medium text-slate-900">
                    ₹{peakBase.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Society Share ({commRate}%):</span>
                  <span>+ ₹{peakCut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-200/60 pt-2 text-sm font-bold text-amber-700">
                  <span>Total Customer Rate:</span>
                  <span>₹{peakTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            loading={saving}
            className="w-full sm:w-auto px-6 font-bold"
          >
            <Save className="mr-2 h-4 w-4" /> Save Pricing Rules
          </Button>
        </div>
      </form>
    </div>
  );
}