import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ReceiptCent as ReceiptPercent, Save } from 'lucide-react';
import { pricingApi } from '@/api/pricing.api';
import type { PricingConfig } from '@/types/pricing';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [normalRupees, setNormalRupees] = useState('399');
  const [peakRupees, setPeakRupees] = useState('499');
  const [commissionPercent, setCommissionPercent] = useState('10');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    pricingApi.getConfig()
      .then((cfg) => {
        setConfig(cfg);
        setNormalRupees((cfg.normalPaise / 100).toString());
        setPeakRupees((cfg.peakPaise / 100).toString());
        setCommissionPercent(cfg.commissionPercent.toString());
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
      });

      setConfig(updated);
      setSuccess(`Pricing rules updated successfully! New quotes will use version ${updated.version}`);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading pricing rules...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pricing Rules & Commissions</h1>
          <p className="text-sm text-slate-500">Configure base rates, peak multipliers, and residence splits.</p>
        </div>
        {config && <Badge tone="emerald">Version {config.version}</Badge>}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ReceiptPercent className="h-5 w-5 text-emerald-600" /> Session Pricing Rates
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Normal Slot Price (₹)"
              type="number"
              value={normalRupees}
              onChange={(e) => setNormalRupees(e.target.value)}
              placeholder="399"
              required
            />

            <Input
              label="Peak Slot Price (₹)"
              type="number"
              value={peakRupees}
              onChange={(e) => setPeakRupees(e.target.value)}
              placeholder="499"
              required
            />
          </div>

          <Input
            label="Society Commission Percent (%)"
            type="number"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            placeholder="10"
            required
          />
        </Card>

        <Card className="space-y-3 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase">Live Preview Calculation</h3>
          <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold text-slate-900">Normal Slot Breakdown</span>
              <p className="mt-1">Base: ₹{normalRupees || '0'}</p>
              <p>Commission ({commissionPercent || '0'}%): ₹{((parseFloat(normalRupees || '0') * parseFloat(commissionPercent || '0')) / 100).toFixed(2)}</p>
              <p className="mt-1 font-bold text-emerald-700">Total: ₹{(parseFloat(normalRupees || '0') * (1 + parseFloat(commissionPercent || '0') / 100)).toFixed(2)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold text-slate-900">Peak Slot Breakdown</span>
              <p className="mt-1">Base: ₹{peakRupees || '0'}</p>
              <p>Commission ({commissionPercent || '0'}%): ₹{((parseFloat(peakRupees || '0') * parseFloat(commissionPercent || '0')) / 100).toFixed(2)}</p>
              <p className="mt-1 font-bold text-emerald-700">Total: ₹{(parseFloat(peakRupees || '0') * (1 + parseFloat(commissionPercent || '0') / 100)).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" /> Save Pricing Rules
        </Button>
      </form>
    </div>
  );
}