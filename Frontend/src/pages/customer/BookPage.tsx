import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

import { societyApi } from '@/api/society.api';
import { pricingApi } from '@/api/pricing.api';
import { bookingsApi } from '@/api/bookings.api';
import { assessmentApi } from '@/api/assessment.api';
import { availabilityApi } from '@/api/availability.api';

import type { Society } from '@/types/society';
import type { PriceQuote } from '@/types/pricing';
import type { BookingMode } from '@/types/booking';
import type { CandidateEvaluation, TimeSlotOption } from '@/types/availability';

import { parseApiError } from '@/api/client';
import { formatPaise } from '@/lib/money';
import { formatIstDateInput } from '@/lib/time';

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
  const [selectedDate, setSelectedDate] = useState(() => formatIstDateInput());

  const [slots, setSlots] = useState<TimeSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  const [candidates, setCandidates] = useState<CandidateEvaluation[]>([]);
  const [preferredTrainerId, setPreferredTrainerId] = useState('');

  const [quote, setQuote] = useState<PriceQuote | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
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

        let initialSocietyId = socList[0]?._id ?? '';
        if (myAssessment.profile && myAssessment.profile.societyId) {
          initialSocietyId =
            typeof myAssessment.profile.societyId === 'object'
              ? myAssessment.profile.societyId._id
              : myAssessment.profile.societyId;
        }
        setSocietyId(initialSocietyId);
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
      setLoadingSlots(true);
      setError(null);
      try {
        let fetchedSlots: TimeSlotOption[] = [];
        if (mode === 'INSTANT') {
          fetchedSlots = await availabilityApi.getInstantOptions(societyId);
        } else {
          fetchedSlots = await availabilityApi.getForDate(societyId, selectedDate);
        }
        setSlots(fetchedSlots);

        const firstAvailable = fetchedSlots.find((s) => s.availableTrainersCount > 0);
        if (firstAvailable) {
          setSelectedSlot(firstAvailable.startAt);
        } else {
          setSelectedSlot('');
          setCandidates([]);
          setQuote(null);
        }
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [societyId, mode, selectedDate]);

  useEffect(() => {
    if (!societyId || !selectedSlot) return;

    async function fetchSlotDetails() {
      try {
        const [q, eligible] = await Promise.all([
          pricingApi.getQuote(selectedSlot),
          availabilityApi.getEligibleTrainers(societyId, selectedSlot),
        ]);
        setQuote(q);
        setCandidates(eligible.candidates);
      } catch (err) {
        setError(parseApiError(err).message);
      }
    }

    fetchSlotDetails();
  }, [societyId, selectedSlot]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!societyId || !selectedSlot) {
      setError('Please select a valid time slot');
      return;
    }

    setError(null);
    setBookingLoading(true);
    const idempotencyKey = `key-${Date.now()}`;

    try {
      const booking = await bookingsApi.create(
        {
          societyId,
          mode,
          startAt: selectedSlot,
          preferredTrainerId: preferredTrainerId || undefined,
        },
        idempotencyKey,
      );
      navigate(`/customer/bookings/${booking._id}`);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading booking options...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Trainer</h1>
        <p className="text-sm text-slate-500">Select an available time slot and book a 60-minute doorstep workout.</p>
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
          <h2 className="text-base font-semibold text-slate-900">2. Select Booking Mode</h2>
          <ModeSwitch mode={mode} onChange={setMode} />

          {mode === 'SCHEDULED' && (
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                min={formatIstDateInput()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">3. Choose Available Time Slot</h2>
          {loadingSlots ? (
            <div className="py-6 text-center text-xs text-slate-500">Checking slot availability...</div>
          ) : (
            <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
          )}
        </Card>

        {selectedSlot && candidates.length > 0 && (
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">4. Select Preferred Trainer</h2>
            <TrainerPicker
              candidates={candidates}
              preferredTrainerId={preferredTrainerId}
              onSelectTrainer={setPreferredTrainerId}
            />
          </Card>
        )}

        {quote && <PriceBreakdownCard quote={quote} />}

        <Button type="submit" fullWidth disabled={!selectedSlot} loading={bookingLoading}>
          Confirm Booking ({quote ? formatPaise(quote.totalPaise) : ''})
        </Button>
      </form>
    </div>
  );
}