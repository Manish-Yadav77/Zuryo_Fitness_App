import { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  UserCheck,
  Clock,
  CheckCircle2,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Home,
  Phone,
  Star,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SessionTimerCard } from '@/components/session/SessionTimerCard';
import { SessionRecordForm } from '@/components/records/SessionRecordForm';

const ITEMS_PER_PAGE = 5;

export default function TrainerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  function loadSessions() {
    bookingsApi
      .getAssigned()
      .then((data) => setBookings(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading assigned workout sessions...
      </div>
    );
  }

  const activeSessions = bookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const completedSessions = bookings.filter((b) => b.status === 'COMPLETED').length;
  const upcomingSessions = bookings.filter((b) => b.status === 'CONFIRMED').length;

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllExpanded =
    paginatedBookings.length > 0 &&
    paginatedBookings.every((b) => expandedIds.includes(b._id));

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedIds((prev) =>
        prev.filter((id) => !paginatedBookings.some((b) => b._id === id))
      );
    } else {
      const currentPageIds = paginatedBookings.map((b) => b._id);
      setExpandedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Trainer Operations
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Trainer Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Manage your assigned doorstep workouts, live session timers, and client logs.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                In Progress
              </p>
              <p className="text-xl font-extrabold text-slate-900">{activeSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Upcoming
              </p>
              <p className="text-xl font-extrabold text-slate-900">{upcomingSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Completed
              </p>
              <p className="text-xl font-extrabold text-slate-900">{completedSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <Card className="py-12 text-center shadow-xs">
          <UserCheck className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No Sessions Assigned</h3>
          <p className="mt-1 text-xs text-slate-500">
            You currently have no doorstep workout sessions assigned.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-base font-bold text-slate-900">
              Assigned Sessions ({bookings.length})
            </h2>

            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-emerald-600" />
              {isAllExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          <div className="space-y-3">
            {paginatedBookings.map((b) => {
              const isExpanded = expandedIds.includes(b._id);

              return (
                <Card
                  key={b._id}
                  className="overflow-hidden p-0 shadow-xs transition-all hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(b._id)}
                    className="flex w-full flex-col gap-3 bg-white p-4 text-left transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3 sm:items-center">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:mt-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {b.societyId ? b.societyId.name : 'Residence'}
                          </span>
                          {b.mode && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                              {b.mode}
                            </span>
                          )}
                        </div>

                        {b.societyId && (
                          <p className="text-xs font-medium text-slate-600">
                            📍 {b.societyId.address}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-0.5">
                          {b.customerDetails?.flatNumber && (
                            <span className="flex items-center gap-1 font-bold text-slate-800">
                              <Home className="h-3.5 w-3.5 text-emerald-600" /> Flat {b.customerDetails.flatNumber}
                            </span>
                          )}
                          {b.customerDetails?.phone && (
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-emerald-600" /> {b.customerDetails.phone}
                              {b.customerDetails.name ? ` (${b.customerDetails.name})` : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(b.startAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                      <Badge
                        tone={
                          b.status === 'IN_PROGRESS' || b.status === 'ON_THE_WAY'
                            ? 'amber'
                            : b.status === 'COMPLETED' || b.status === 'CONFIRMED'
                            ? 'emerald'
                            : 'slate'
                        }
                      >
                        {b.status}
                      </Badge>
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-transform">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50/40 p-4">
                      {b.sessionRecord && (b.sessionRecord.customerRating || b.sessionRecord.customerFeedback) && (
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              Customer Review & Feedback
                            </span>
                            {b.sessionRecord.customerRating && (
                              <span className="rounded-md bg-amber-100 px-2.5 py-0.5 font-extrabold text-amber-800">
                                {b.sessionRecord.customerRating} / 5 Stars
                              </span>
                            )}
                          </div>
                          {b.sessionRecord.customerFeedback && (
                            <p className="mt-1.5 italic text-slate-700">"{b.sessionRecord.customerFeedback}"</p>
                          )}
                        </div>
                      )}

                      <SessionTimerCard
                        bookingId={b._id}
                        isTrainer={true}
                        bookingStatus={b.status}
                        onStatusChange={loadSessions}
                      />

                      {['IN_PROGRESS', 'COMPLETED'].includes(b.status) && (
                        <div className="border-t border-slate-200/60 pt-4">
                          <SessionRecordForm bookingId={b._id} onSaved={loadSessions} />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
              <span className="text-xs font-medium text-slate-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, bookings.length)} of {bookings.length} sessions
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                      currentPage === p
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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