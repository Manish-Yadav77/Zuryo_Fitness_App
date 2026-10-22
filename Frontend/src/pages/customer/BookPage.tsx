import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  UserCheck,
  CreditCard,
} from 'lucide-react';

import { societyApi } from '@/api/society.api';
import { pricingApi } from '@/api/pricing.api';
import { bookingsApi } from '@/api/bookings.api';
import { availabilityApi } from '@/api/availability.api';
import { assessmentApi } from '@/api/assessment.api';
import { packagesApi } from '@/api/packages.api';

import type { Society } from '@/types/society';
import type { PriceQuote } from '@/types/pricing';
import type { BookingMode } from '@/types/booking';
import type { CustomerPackage } from '@/types/package';
import type { EligibleTrainerInfo, TimeSlotOption } from '@/types/availability';
import { parseApiError } from '@/api/client';
import { formatPaise } from '@/lib/money';
import { todayIst } from '@/lib/time';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PriceBreakdownCard } from '@/components/pricing/PriceBreakdownCard';
import { ModeSwitch } from '@/components/booking/ModeSwitch';
import { SlotGrid } from '@/components/booking/SlotGrid';
import { TrainerPicker } from '@/components/booking/TrainerPicker';

export default function BookPage() {
  const navigate = useNavigate();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState('');
  const [mode, setMode] = useState<BookingMode>('INSTANT');
  const [selectedDate, setSelectedDate] = useState<string>(() => todayIst());

  const [availableSlots, setAvailableSlots] = useState<TimeSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [eligibleTrainers, setEligibleTrainers] = useState<EligibleTrainerInfo[]>([]);
  const [preferredTrainerId, setPreferredTrainerId] = useState<string | undefined>(
    undefined
  );

  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [paymentMode, setPaymentMode] = useState<'PAYMENT' | 'PACKAGE'>('PAYMENT');

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [socList, myAssessment, packageList] = await Promise.all([
          societyApi.getSocieties(),
          assessmentApi.getMine(),
          packagesApi.getMine(),
        ]);
        setSocieties(socList || []);
        setPackages(packageList || []);

        let sId = socList[0]?._id ?? '';
        if (myAssessment.profile && myAssessment.profile.societyId) {
          sId =
            typeof myAssessment.profile.societyId === 'object'
              ? myAssessment.profile.societyId._id
              : myAssessment.profile.societyId;
        }
        setSocietyId(sId);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (!societyId) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      setError(null);
      try {
        if (mode === 'INSTANT') {
          const options = await availabilityApi.getInstantOptions(societyId);
          setAvailableSlots(options || []);
          if (options && options.length > 0) {
            handleSelectSlot(options[0]?.startAt ?? null);
          } else {
            setSelectedSlot(null);
            setQuote(null);
          }
        } else {
          const slots = await availabilityApi.getDaySlots(
            societyId,
            selectedDate,
            preferredTrainerId
          );
          setAvailableSlots(slots || []);
          if (slots && slots.length > 0) {
            handleSelectSlot(slots[0]?.startAt ?? null);
          } else {
            setSelectedSlot(null);
            setQuote(null);
          }
        }
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [societyId, mode, selectedDate, preferredTrainerId]);

  async function handleSelectSlot(slotIso: string | null) {
    setSelectedSlot(slotIso);
    if (!slotIso) {
      setQuote(null);
      setEligibleTrainers([]);
      return;
    }

    try {
      const [q, trainers] = await Promise.all([
        pricingApi.getQuote(slotIso),
        availabilityApi.getEligibleTrainers(societyId, slotIso),
      ]);
      setQuote(q);
      setEligibleTrainers(trainers || []);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!societyId || !selectedSlot) {
      setError('Please select a society and an available time slot.');
      return;
    }

    setError(null);
    setBookingLoading(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      const booking = await bookingsApi.create(
        {
          societyId,
          mode,
          startAt: selectedSlot,
          preferredTrainerId,
          paymentMode,
        },
        idempotencyKey
      );
      navigate(`/customer/bookings/${booking._id}`);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading booking engine...
      </div>
    );
  }

  const hasActivePackage = packages.some(
    (p) => p.usedSessions < p.totalSessions && new Date(p.expiresAt) > new Date()
  );

  return (
    <div>
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Doorstep Training
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Book a Trainer
        </h1>
        <p className="text-sm text-slate-500">
          Select an available slot in your society and auto-assign a top coach.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. Select Society
              </h2>
              <p className="text-xs text-slate-500">
                Choose the location where your session will take place.
              </p>
            </div>
          </div>

          <div className="relative">
            <select
              value={societyId}
              onChange={(e) => setSocietyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
            >
              {societies.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.address})
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Select Booking Type
              </h2>
              <p className="text-xs text-slate-500">
                Choose instant workout or schedule for a future date.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === 'SCHEDULED' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Workout Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayIst()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. Choose Time Slot
              </h2>
              <p className="text-xs text-slate-500">
                Available time slots based on active trainers near your society.
              </p>
            </div>
          </div>

          {slotsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Checking trainer availability grid...
            </div>
          ) : (
            <SlotGrid
              slots={availableSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
            />
          )}
        </Card>

        {selectedSlot && eligibleTrainers.length > 0 && (
          <Card className="p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  4. Trainer Assignment
                </h2>
                <p className="text-xs text-slate-500">
                  Auto-assign or select your preferred available trainer.
                </p>
              </div>
            </div>

            <TrainerPicker
              trainers={eligibleTrainers}
              selectedTrainerId={preferredTrainerId}
              onSelectTrainer={setPreferredTrainerId}
            />
          </Card>
        )}

        {quote && <PriceBreakdownCard quote={quote} />}

        {quote && (
          <Card className="p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  5. Choose Payment Method
                </h2>
                <p className="text-xs text-slate-500">
                  Pay directly via online checkout or use pre-purchased package credits.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  paymentMode === 'PAYMENT'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'PAYMENT'}
                  onChange={() => setPaymentMode('PAYMENT')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-900">
                    Pay securely with Razorpay
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatPaise(quote.totalPaise)} is charged only after you complete checkout.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                  hasActivePackage
                    ? paymentMode === 'PACKAGE'
                      ? 'border-emerald-500 bg-emerald-50/40 cursor-pointer ring-1 ring-emerald-500/20'
                      : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                    : 'cursor-not-allowed border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'PACKAGE'}
                  disabled={!hasActivePackage}
                  onChange={() => setPaymentMode('PACKAGE')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="block text-sm font-bold text-slate-900">
                      Use a package credit
                    </span>
                    {hasActivePackage && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Available
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Uses one credit from your earliest-expiring package. ₹0 payable today.
                  </span>
                </div>
              </label>
            </div>
          </Card>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            loading={bookingLoading}
            disabled={!selectedSlot}
            className="py-3 text-sm font-bold"
          >
            {paymentMode === 'PACKAGE'
              ? 'Book with Package Credit (₹0)'
              : `Continue to Payment (${
                  quote ? formatPaise(quote.totalPaise) : 'Select Slot'
                })`}
          </Button>
        </div>
      </form>
    </div>
  );
}