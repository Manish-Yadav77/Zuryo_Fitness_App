import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  MapPin,
  Clock,
  Wallet,
  Receipt,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ITEMS_PER_PAGE = 5;

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>(
    'UPCOMING'
  );
  const [page, setPage] = useState(1);

  // Reschedule & Cancel Inline States
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newSlotTime, setNewSlotTime] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const data = await bookingsApi.getMine();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Reset pagination when switching tabs
  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function handleCancel(id: string) {
    try {
      await bookingsApi.cancel(id, cancelReason || 'Cancelled via web dashboard');
      setCancellingId(null);
      setCancelReason('');
      await loadBookings();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReschedule(id: string) {
    if (!newSlotTime) return;
    try {
      await bookingsApi.reschedule(id, new Date(newSlotTime).toISOString());
      setReschedulingId(null);
      setNewSlotTime('');
      await loadBookings();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center py-12 text-sm text-slate-500">
        Loading bookings...
      </div>
    );
  }

  const visible = bookings.filter((b) =>
    tab === 'UPCOMING'
      ? ['PENDING_PAYMENT', 'CONFIRMED', 'ON_THE_WAY'].includes(b.status)
      : tab === 'ACTIVE'
      ? b.status === 'IN_PROGRESS'
      : tab === 'COMPLETED'
      ? b.status === 'COMPLETED'
      : ['CANCELLED', 'EXPIRED'].includes(b.status)
  );

  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = visible.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'emerald';
      case 'IN_PROGRESS':
      case 'ON_THE_WAY':
      case 'PENDING_PAYMENT':
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
      {/* Header Section */}
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Plan & Progress
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Bookings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your current and past workout sessions.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              tab === name
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {name[0] + name.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content Section */}
      {visible.length === 0 ? (
        <Card className="py-12 text-center shadow-xs">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No Bookings Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            You don't have any sessions listed under {tab.toLowerCase()}.
          </p>
          <Link
            to="/customer/book"
            className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          >
            Book a Workout Session
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, visible.length)} of {visible.length}
            </span>
          </div>

          <div className="space-y-3">
            {paginatedBookings.map((b) => {
              const isCancelled = b.status === 'CANCELLED' || b.status === 'EXPIRED';
              const isPackage = b.paymentMode === 'PACKAGE';
              const totalVal = b.priceSnapshot?.totalPaise || 0;
              const canManage = !isCancelled && b.status === 'CONFIRMED';

              return (
                <Card
                  key={b._id}
                  className={`p-4 shadow-xs transition-all ${
                    isCancelled ? 'bg-slate-50/50 opacity-85' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{b.societyId ? b.societyId.name : 'Residence'}</span>
                        </div>
                        <Badge tone={getStatusTone(b.status)}>{b.status}</Badge>

                        {/* Payment Method Badge */}
                        <Badge tone={isPackage ? 'sky' : 'emerald'}>
                          {isPackage ? 'Package Credit' : 'Direct Payment'}
                        </Badge>

                        {(b.rescheduleCount ?? 0) > 0 && (
                          <Badge tone="sky">Rescheduled ×{b.rescheduleCount}</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>
                            {new Date(b.startAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        {b.mode && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {b.mode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price / Credit Breakdown Box */}
                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <div className="text-left sm:text-right">
                        {isCancelled ? (
                          <div>
                            <span className="block text-sm font-bold text-rose-600">₹0.00</span>
                            <span className="block text-[10px] text-slate-400 line-through">
                              Val: {formatPaise(totalVal)}
                            </span>
                          </div>
                        ) : isPackage ? (
                          <div>
                            <div className="flex items-center gap-1 sm:justify-end">
                              <Wallet className="h-3.5 w-3.5 text-sky-600" />
                              <span className="text-sm font-extrabold text-sky-700">₹0.00</span>
                            </div>
                            <span className="block text-[10px] font-semibold text-slate-500">
                              1 Credit (Val: {formatPaise(totalVal)})
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 sm:justify-end">
                              <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatPaise(totalVal)}
                              </span>
                            </div>
                            <span className="block text-[10px] font-semibold text-emerald-600">
                              Paid Cash
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/customer/bookings/${b._id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title="View Details"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Action buttons & Ref section */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      Ref: #{b._id.slice(-8)}
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReschedulingId(b._id);
                            setCancellingId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCancellingId(b._id);
                            setReschedulingId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          Cancel
                        </button>

                        <Link
                          to={`/customer/bookings/${b._id}`}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 ml-1"
                        >
                          View Details →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Inline Reschedule Form */}
                  {reschedulingId === b._id && (
                    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-2">
                      <p className="text-xs font-bold text-sky-900">Select New Slot Time</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="datetime-local"
                          value={newSlotTime}
                          onChange={(e) => setNewSlotTime(e.target.value)}
                          className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleReschedule(b._id)}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                        >
                          Confirm Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Cancel Form */}
                  {cancellingId === b._id && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 space-y-2">
                      <p className="text-xs font-bold text-rose-900">Confirm Cancellation</p>
                      <p className="text-[11px] text-rose-700">
                        {isPackage
                          ? 'Cancelling will restore 1 package credit to your balance.'
                          : 'Cancelling will process a full cash refund back to your payment source.'}
                      </p>
                      <input
                        type="text"
                        placeholder="Reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancel(b._id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                        >
                          Confirm Cancellation
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingId(null)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Keep Booking
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}