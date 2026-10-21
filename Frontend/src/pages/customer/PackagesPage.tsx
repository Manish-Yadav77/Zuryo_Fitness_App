import { useEffect, useState } from 'react';
import {
  Check,
  ShieldCheck,
  Zap,
  PackageCheck,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { packagesApi } from '@/api/packages.api';
import { paymentsApi } from '@/api/payments.api';
import type { CustomerPackage, PackageTemplate } from '@/types/package';
import type { RazorpaySuccessResponse } from '@/types/payment';
import { parseApiError } from '@/api/client';
import { formatPaise } from '@/lib/money';
import { loadRazorpayScript } from '@/lib/razorpay';
import { env } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';

import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const ITEMS_PER_PAGE = 4;

export default function PackagesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [myPackages, setMyPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [packagePage, setPackagePage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const [tplList, pkgList] = await Promise.all([
          packagesApi.getTemplates(),
          packagesApi.getMine(),
        ]);
        setTemplates(tplList || []);
        setMyPackages(pkgList || []);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleBuyPackage(tpl: PackageTemplate) {
    setError(null);
    setSuccess(null);
    setPurchasingId(tpl._id);

    try {
      const order = await paymentsApi.createOrder(undefined, tpl._id);

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError(
          'Could not load the payment window. Check your internet connection and try again.'
        );
        setPurchasingId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: env.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Zuryo Fit',
        description: `Purchase ${tpl.name}`,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#059669' },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const result = await paymentsApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (result.package) {
              const created = result.package;
              setMyPackages((prev) => [
                created,
                ...prev.filter((p) => p._id !== created._id),
              ]);
              setSuccess(
                `Successfully purchased ${tpl.name}! ${tpl.sessions} sessions added.`
              );
            }
          } catch (verr) {
            setError(parseApiError(verr).message);
          } finally {
            setPurchasingId(null);
          }
        },
        modal: {
          ondismiss: () => setPurchasingId(null),
        },
      });
      rzp.open();
    } catch (err) {
      setError(parseApiError(err).message);
      setPurchasingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading workout packages...
      </div>
    );
  }

  const totalPackagePages = Math.ceil(myPackages.length / ITEMS_PER_PAGE) || 1;
  const paginatedMyPackages = myPackages.slice(
    (packagePage - 1) * ITEMS_PER_PAGE,
    packagePage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Bundles & Savings
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Session Packages
        </h1>
        <p className="text-sm text-slate-500">
          Pre-purchase session bundles for discount savings and easy workout bookings.
        </p>
      </div>

      {error && <div className="mb-6"><Alert tone="error">{error}</Alert></div>}
      {success && <div className="mb-6"><Alert tone="success">{success}</Alert></div>}

      {/* Card 1: Your Active Packages */}
      <Card className="mb-8 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Active Packages</h2>
              <p className="text-xs text-slate-500">
                Track remaining sessions and expiration dates for your purchased bundles.
              </p>
            </div>
          </div>
          {myPackages.length > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              {myPackages.length} Total Purchased
            </span>
          )}
        </div>

        {myPackages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
            You don't have any active session packages yet. Choose a package below to get started!
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedMyPackages.map((p) => {
                const remaining = p.totalSessions - p.usedSessions;
                const usagePercent = Math.min(
                  100,
                  Math.round((p.usedSessions / p.totalSessions) * 100)
                );

                return (
                  <div
                    key={p._id}
                    className="flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 p-4 shadow-xs transition-all hover:border-emerald-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {p.packageName}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Used {p.usedSessions} of {p.totalSessions} sessions
                          </p>
                        </div>
                        <div>
                          <Badge tone={remaining > 0 ? 'emerald' : 'slate'}>
                            {remaining} Left
                          </Badge>
                        </div>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-emerald-100 pt-3 text-[11px] font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Expires on{' '}
                        <strong className="text-slate-700">
                          {new Date(p.expiresAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for Active Packages */}
            {totalPackagePages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  Page {packagePage} of {totalPackagePages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPackagePage((prev) => Math.max(prev - 1, 1))}
                    disabled={packagePage === 1}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPackagePage((prev) => Math.min(prev + 1, totalPackagePages))
                    }
                    disabled={packagePage === totalPackagePages}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Section 2: Purchase New Package */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Purchase a New Package
            </h2>
            <p className="text-xs text-slate-500">
              Select a session bundle that best fits your fitness goal.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const pricePerSession = Math.round(tpl.pricePaise / tpl.sessions / 100);

            return (
              <Card
                key={tpl._id}
                className="flex flex-col justify-between p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Zap className="h-5 w-5" />
                    </span>
                    <div>
                      <Badge tone="sky">{tpl.validityDays} Days Validity</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{tpl.name}</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatPaise(tpl.pricePaise)}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        (~₹{pricePerSession}/session)
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                          {tpl.sessions} 60-minute sessions
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Valid in all societies</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Instant account credit</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-xs rounded-xl"
                    loading={purchasingId === tpl._id}
                    onClick={() => handleBuyPackage(tpl)}
                  >
                    Buy Package Now
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}