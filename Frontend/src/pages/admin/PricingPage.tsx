import { useEffect, useState } from 'react';
import { pricingApi } from '@/api/pricing.api';
import type { PriceQuote, PricingConfig } from '@/types/pricing';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [testTime, setTestTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pricingApi.getConfig().then(setConfig).catch(console.error);
  }, []);

  async function handleTestQuote() {
    if (!testTime) return;
    setLoading(true);
    try {
      const isoDate = new Date(testTime).toISOString();
      const q = await pricingApi.getQuote(isoDate);
      setQuote(q);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!config) return <div className="py-10 text-center text-slate-500">Loading pricing rules...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Configuration</h1>
        <p className="text-sm text-slate-500">Active rules and peak hour definitions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold text-slate-500">Normal Slot</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatPaise(config.normalPaise)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500">Peak Slot</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatPaise(config.peakPaise)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500">Society Commission</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{config.commissionPercent}%</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Peak Windows</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {config.peakWindows.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-slate-700">
                {w.weekdays.map((d) => dayNames[d]).join(', ')}
              </span>
              <span className="text-slate-500">
                {w.start} - {w.end} IST
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Quote Tester</h2>
        <p className="mt-1 text-xs text-slate-500">Test slot time to compute total payable amount.</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="datetime-local"
            value={testTime}
            onChange={(e) => setTestTime(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />
          <Button onClick={handleTestQuote} loading={loading}>
            Calculate Quote
          </Button>
        </div>

        {quote && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between font-medium text-slate-900">
              <span>Tier:</span>
              <Badge tone={quote.tier === 'PEAK' ? 'amber' : 'emerald'}>{quote.tier}</Badge>
            </div>
            <div className="mt-2 flex justify-between text-slate-600">
              <span>Session:</span>
              <span>{formatPaise(quote.sessionPaise)}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Commission ({quote.commissionPercent}%):</span>
              <span>{formatPaise(quote.commissionPaise)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="text-emerald-700">{formatPaise(quote.totalPaise)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}