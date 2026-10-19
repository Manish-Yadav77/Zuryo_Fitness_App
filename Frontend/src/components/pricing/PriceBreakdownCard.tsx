import { formatPaise } from '@/lib/money';
import type { PriceQuote } from '@/types/pricing';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function PriceBreakdownCard({ quote }: { quote: PriceQuote }) {
  const isPeak = quote.tier === 'PEAK';

  return (
    <Card className="border-emerald-100 bg-emerald-50/30">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <h3 className="font-semibold text-slate-900">Price Breakdown</h3>
        <Badge tone={isPeak ? 'amber' : 'emerald'}>
          {isPeak ? 'Peak Slot' : 'Normal Slot'}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Session price</span>
          <span className="font-medium text-slate-900">{formatPaise(quote.sessionPaise)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Society commission ({quote.commissionPercent}%)</span>
          <span className="font-medium text-slate-900">{formatPaise(quote.commissionPaise)}</span>
        </div>

        <div className="flex justify-between border-t border-slate-200/80 pt-2 text-base font-bold text-slate-900">
          <span>Total payable</span>
          <span className="text-emerald-700">{formatPaise(quote.totalPaise)}</span>
        </div>
      </div>
    </Card>
  );
}