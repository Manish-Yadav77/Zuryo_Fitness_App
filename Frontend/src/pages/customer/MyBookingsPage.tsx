import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, MapPin, Clock } from 'lucide-react';
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

  useEffect(() => {
    bookingsApi
      .getMine()
      .then((data) => setBookings(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Reset pagination when switching tabs
  useEffect(() => {
    setPage(1);
  }, [tab]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
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
            {paginatedBookings.map((b) => (
              <Link key={b._id} to={`/customer/bookings/${b._id}`} className="block">
                <Card className="flex flex-col gap-3 p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                        <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{b.societyId ? b.societyId.name : 'Residence'}</span>
                      </div>
                      <Badge tone={getStatusTone(b.status)}>{b.status}</Badge>
                      {(b.rescheduleCount ?? 0) > 0 && (
                        <Badge tone="sky">Rescheduled ×{b.rescheduleCount}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        {new Date(b.startAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {b.mode && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          {b.mode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:justify-end sm:gap-4 sm:border-t-0 sm:pt-0">
                    <span className="text-base font-extrabold text-slate-900">
                      {formatPaise(b.priceSnapshot?.totalPaise || 0)}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
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