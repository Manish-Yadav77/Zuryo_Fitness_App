import { useEffect, useState } from 'react'
import { Check, ShieldCheck, Zap } from 'lucide-react'
import { packagesApi } from '@/api/packages.api'
import { paymentsApi } from '@/api/payments.api'
import type { CustomerPackage, PackageTemplate } from '@/types/package'
import type { RazorpaySuccessResponse } from '@/types/payment'
import { parseApiError } from '@/api/client'
import { formatPaise } from '@/lib/money'
import { loadRazorpayScript } from '@/lib/razorpay'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'

import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function PackagesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<PackageTemplate[]>([])
  const [myPackages, setMyPackages] = useState<CustomerPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [tplList, pkgList] = await Promise.all([packagesApi.getTemplates(), packagesApi.getMine()])
        setTemplates(tplList)
        setMyPackages(pkgList)
      } catch (err) {
        setError(parseApiError(err).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleBuyPackage(tpl: PackageTemplate) {
    setError(null)
    setSuccess(null)
    setPurchasingId(tpl._id)

    try {
      // 1. The server creates the Razorpay order (the price comes from the server, not from here)
      const order = await paymentsApi.createOrder(undefined, tpl._id)

      // 2. Load the Razorpay checkout script. If it cannot load we stop: there is no fake payment path.
      const loaded = await loadRazorpayScript()
      if (!loaded || !window.Razorpay) {
        setError('Could not load the payment window. Check your internet connection and try again.')
        setPurchasingId(null)
        return
      }

      // 3. Open the Razorpay test checkout
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
            // 4. The server verifies the signature and creates the package itself
            const result = await paymentsApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            if (result.package) {
              const created = result.package
              setMyPackages((prev) => [created, ...prev.filter((p) => p._id !== created._id)])
              setSuccess(`Successfully purchased ${tpl.name}! ${tpl.sessions} sessions added.`)
            }
          } catch (verr) {
            setError(parseApiError(verr).message)
          } finally {
            setPurchasingId(null)
          }
        },
        modal: {
          ondismiss: () => setPurchasingId(null),
        },
      })
      rzp.open()
    } catch (err) {
      setError(parseApiError(err).message)
      setPurchasingId(null)
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading workout packages...</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Session Packages</h1>
        <p className="text-sm text-slate-500">Pre-purchase session bundles for savings and easy booking.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Your Active Packages</h2>
        {myPackages.length === 0 ? (
          <p className="mt-2 py-4 text-center text-sm text-slate-500">You don't have any active session packages.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {myPackages.map((p) => {
              const remaining = p.totalSessions - p.usedSessions
              return (
                <div key={p._id} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{p.packageName}</h3>
                    <Badge tone="emerald">{remaining} Left</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Used {p.usedSessions} of {p.totalSessions} sessions
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Expires on {new Date(p.expiresAt).toLocaleDateString()}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Purchase a New Package</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl._id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Zap className="h-4 w-4" />
                  </span>
                  <Badge tone="sky">{tpl.validityDays} Days</Badge>
                </div>
                <h3 className="mt-3 font-bold text-slate-900">{tpl.name}</h3>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatPaise(tpl.pricePaise)}</p>
                <p className="mt-1 text-xs text-slate-500">{tpl.description}</p>

                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{tpl.sessions} 60-minute sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Valid in all societies</span>
                  </li>
                </ul>
              </div>

              <Button className="mt-6" loading={purchasingId === tpl._id} onClick={() => handleBuyPackage(tpl)}>
                Buy Now
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}