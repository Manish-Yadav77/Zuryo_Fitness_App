import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  MapPin,
  XCircle,
  ArrowLeft,
  CreditCard,
  Star,
  Wallet,
  Receipt,
  Check,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import type { SessionRecord } from '@/types/record';
import { parseApiError } from '@/api/client';
import { formatPaise } from '@/lib/money';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SessionTimerCard } from '@/components/session/SessionTimerCard';
import { paymentsApi } from '@/api/payments.api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { env } from '@/config/env';
import type { RazorpaySuccessResponse } from '@/types/payment';
import { useAuth } from '@/hooks/useAuth';
import { recordApi } from '@/api/record.api';

export default function BookingDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  async function loadBooking() {
    if (!id) return;
    try {
      const [bookingData, recordData] = await Promise.all([
        bookingsApi.getById(id),
        recordApi.getByBooking(id).catch(() => null),
      ]);
      setBooking(bookingData);
      setRecord(recordData);

      if (recordData?.customerRating) {
        setRating(recordData.customerRating);
        setFeedback(recordData.customerFeedback || '');
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    setError(null);
    setCancelling(true);
    try {
      const updated = await bookingsApi.cancel(id, 'Cancelled via web dashboard');
      setBooking(updated);
      setSuccess('Booking cancelled successfully.');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setCancelling(false);
    }
  }

  async function handlePay() {
    if (!booking) return;
    setError(null);
    setPaying(true);
    try {
      const order = await paymentsApi.createOrder(booking._id);
      if (!(await loadRazorpayScript()) || !window.Razorpay) {
        throw new Error('Could not load the payment window.');
      }
      new window.Razorpay({
        key: order.keyId || env.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'Zuryo Fit',
        description: 'Trainer session',
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#059669' },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await paymentsApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setSuccess('Payment confirmed. Your trainer has been notified.');
            loadBooking();
          } catch (err) {
            setError(parseApiError(err).message);
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      }).open();
    } catch (err) {
      setError(parseApiError(err).message);
      setPaying(false);
    }
  }

  async function handleFeedback() {
    if (!booking) return;
    setSavingFeedback(true);
    setError(null);
    try {
      const updatedRecord = await recordApi.submitFeedback(booking._id, rating, feedback);
      setRecord(updatedRecord);
      setFeedbackSubmitted(true);
      setSuccess('Thank you! Your rating and feedback have been saved.');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSavingFeedback(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading booking details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Booking not found.
      </div>
    );
  }

  const canCancel = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'EXPIRED';
  const isPackage = booking.paymentMode === 'PACKAGE';
  const totalVal = booking.priceSnapshot?.totalPaise || 0;

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'emerald';
      case 'PENDING_PAYMENT':
      case 'IN_PROGRESS':
      case 'ON_THE_WAY':
        return 'amber';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/customer/bookings"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Bookings
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Booking Details
          </h1>
          <p className="mt-0.5 text-xs font-mono text-slate-500">ID: {booking._id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <Badge tone={getStatusTone(booking.status)}>{booking.status}</Badge>
          <Badge tone={isPackage ? 'sky' : 'emerald'}>
            {isPackage ? 'Package Credit' : 'Direct Payment'}
          </Badge>
        </div>
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

      <div className="mb-6">
        <SessionTimerCard
          bookingId={booking._id}
          isTrainer={false}
          bookingStatus={booking.status}
          onStatusChange={loadBooking}
        />
      </div>

      {booking.status === 'PENDING_PAYMENT' && (
        <div className="mb-6">
          <Alert tone="error">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-rose-900">Payment Required</p>
                <p className="text-xs text-rose-700">
                  This slot is reserved for 10 minutes. Complete payment to confirm your booking.
                </p>
              </div>
              <Button
                loading={paying}
                onClick={handlePay}
                className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2"
              >
                Pay Now
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <Card className="mb-6 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Session Details
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Location
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {booking.societyId ? booking.societyId.name : 'Residence'}
              </span>
              {booking.societyId?.address && (
                <span className="block text-slate-500 text-[11px]">
                  {booking.societyId.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Scheduled Time
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {new Date(booking.startAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:col-span-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Trainer Status
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {booking.trainerId
                  ? 'Trainer Assigned'
                  : 'Pending Trainer Auto-Assignment'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment & Credit Breakdown Card */}
      <Card className="mb-6 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Payment Breakdown</h2>
          </div>
          <Badge tone={isPackage ? 'sky' : 'emerald'}>
            {isPackage ? 'Package Credit Redemption' : 'Razorpay Direct Payment'}
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Session Base Fee</span>
            <span className="font-medium text-slate-900">
              {formatPaise(booking.priceSnapshot?.sessionPaise || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              Society Commission ({booking.priceSnapshot?.commissionPercent || 0}%)
            </span>
            <span className="font-medium text-slate-900">
              {formatPaise(booking.priceSnapshot?.commissionPaise || 0)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-700">
            <span>Session Monetary Value</span>
            <span>{formatPaise(totalVal)}</span>
          </div>

          {/* Checkout Charged Amount */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-sm font-bold text-slate-900">
            <div>
              <span className="block text-xs font-bold text-slate-700">
                Total Charged at Checkout
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {isCancelled
                  ? isPackage
                    ? '1 Package Credit Restored to Balance'
                    : 'Cash Payment Refunded'
                  : isPackage
                  ? '1 Package Credit Used'
                  : 'Paid via Razorpay Direct'}
              </span>
            </div>
            <div className="text-right">
              {isCancelled ? (
                <span className="text-rose-600">₹0.00</span>
              ) : isPackage ? (
                <div className="flex items-center gap-1 text-sky-700">
                  <Wallet className="h-4 w-4" />
                  <span>₹0.00</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-700">
                  <Receipt className="h-4 w-4" />
                  <span>{formatPaise(totalVal)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {booking.status === 'COMPLETED' && (
        <Card className="mb-6 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Rate Your Workout</h2>
              <p className="text-xs text-slate-500">
                How was your doorstep training session?
              </p>
            </div>
            {feedbackSubmitted && (
              <Badge tone="emerald">Feedback Submitted</Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    value <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-slate-700">
              {rating} / 5 Stars
            </span>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What worked well during this session? Any notes for your trainer?"
            className="min-h-24 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 shadow-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />

          <Button
            loading={savingFeedback}
            onClick={handleFeedback}
            className="font-semibold text-xs px-5"
          >
            {feedbackSubmitted ? 'Update Feedback' : 'Submit Feedback'}
          </Button>

          {record?.trainerNotes && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">Trainer Notes:</span>
              <p className="text-slate-600 italic">{record.trainerNotes}</p>
            </div>
          )}
        </Card>
      )}

      {canCancel && (
        <div className="mb-6 flex justify-end">
          <Button
            variant="ghost"
            loading={cancelling}
            onClick={handleCancel}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium text-xs"
          >
            <XCircle className="mr-1.5 h-4 w-4" /> Cancel Booking
          </Button>
        </div>
      )}
    </div>
  );
}