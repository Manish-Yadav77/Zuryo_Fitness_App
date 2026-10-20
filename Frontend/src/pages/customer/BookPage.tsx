import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Zap } from 'lucide-react';

import { societyApi } from '@/api/society.api';
import { pricingApi } from '@/api/pricing.api';
import { bookingsApi } from '@/api/bookings.api';
import { paymentsApi } from '@/api/payments.api';
import { assessmentApi } from '@/api/assessment.api';

import type { Society } from '@/types/society';
import type { PriceQuote } from '@/types/pricing';
import type { BookingMode } from '@/types/booking';
import { parseApiError } from '@/api/client';
import { formatPaise } from '@/lib/money';
import { loadRazorpayScript } from '@/lib/razorpay';
import { env } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PriceBreakdownCard } from '@/components/pricing/PriceBreakdownCard';

function getNextInstantSlot(): string {
  const now = new Date();
  // Round up to next 15-minute atom
  const ms = 1000 * 60 * 15;
  const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
  return rounded.toISOString();
}

export default function BookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState('');
  const [mode, setMode] = useState<BookingMode>('INSTANT');
  const [selectedSlot, setSelectedSlot] = useState<string>(getNextInstantSlot());
  const [quote, setQuote] = useState<PriceQuote | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [socList, myAssessment] = await Promise.all([
          societyApi.getSocieties(),
          assessmentApi.getMine(),
        ]);
        setSocieties(socList);

        if (myAssessment.profile && myAssessment.profile.societyId) {
          const sId =
            typeof myAssessment.profile.societyId === 'object'
              ? myAssessment.profile.societyId._id
              : myAssessment.profile.societyId;
          setSocietyId(sId);
        } else if (socList.length > 0) {
          setSocietyId(socList[0]?._id ?? '');
        }

        const instantIso = getNextInstantSlot();
        setSelectedSlot(instantIso);

        const q = await pricingApi.getQuote(instantIso);
        setQuote(q);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  async function handleModeSwitch(newMode: BookingMode) {
    setMode(newMode);
    setError(null);

    let slot = selectedSlot;
    if (newMode === 'INSTANT') {
      slot = getNextInstantSlot();
      setSelectedSlot(slot);
    }

    try {
      const q = await pricingApi.getQuote(slot);
      setQuote(q);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  }

  async function handleSlotChange(isoDate: string) {
    setSelectedSlot(isoDate);
    try {
      const q = await pricingApi.getQuote(isoDate);
      setQuote(q);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!societyId || !selectedSlot) {
      setError('Please select a society and time slot');
      return;
    }

    setError(null);
    setBookingLoading(true);

    try {
      // 1. Create booking doc
      const idempotencyKey = `key-${Date.now()}`;
      const booking = await bookingsApi.create(
        {
          societyId,
          mode,
          startAt: selectedSlot,
        },
        idempotencyKey,
      );

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError('Could not load the payment window. Check your internet connection and try again.');
        setBookingLoading(false);
        return;
      }

      // 3. Create Razorpay order from backend
      const order = await paymentsApi.createOrder(booking._id);

      // 4. Trigger Razorpay Checkout Popup Modal
      const options = {
        key: env.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Zuryo Fit',
        description: 'Workout Session Payment',
        order_id: order.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#059669' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await paymentsApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            navigate(`/customer/bookings/${booking._id}`);
          } catch (verr) {
            setError(parseApiError(verr).message);
          }
        },
        modal: {
          ondismiss: () => {
            setBookingLoading(false);
            navigate(`/customer/bookings/${booking._id}`);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(parseApiError(err).message);
      setBookingLoading(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading booking options...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Trainer</h1>
        <p className="text-sm text-slate-500">Instant or scheduled 60-minute fitness sessions at your doorstep.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MapPin className="h-5 w-5 text-emerald-600" /> 1. Select Residence
          </h2>
          <select
            value={societyId}
            onChange={(e) => setSocietyId(e.target.value)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
          >
            {societies.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.address})
              </option>
            ))}
          </select>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">2. Booking Mode</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleModeSwitch('INSTANT')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                mode === 'INSTANT'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="h-6 w-6 text-emerald-600" />
              <span>Instant (Within 60m)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('SCHEDULED')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                mode === 'SCHEDULED'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-6 w-6 text-emerald-600" />
              <span>Scheduled</span>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              {mode === 'INSTANT' ? 'Auto-Selected Instant Slot' : 'Select Scheduled Time Slot'}
            </label>
            {mode === 'INSTANT' ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-900">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{new Date(selectedSlot).toLocaleString()} (Starts within 60 min)</span>
              </div>
            ) : (
              <input
                type="datetime-local"
                value={selectedSlot ? new Date(selectedSlot).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSlotChange(new Date(e.target.value).toISOString());
                  }
                }}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />
            )}
          </div>
        </Card>

        {quote && <PriceBreakdownCard quote={quote} />}

        <Button type="submit" fullWidth loading={bookingLoading}>
          Confirm Booking & Pay ({quote ? formatPaise(quote.totalPaise) : ''})
        </Button>
      </form>
    </div>
  );
}