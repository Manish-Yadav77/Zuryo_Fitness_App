import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { AssignmentDecisionDoc } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ITEMS_PER_PAGE = 5;

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [decisions, setDecisions] = useState<AssignmentDecisionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingPage, setBookingPage] = useState(1);
  const [decisionPage, setDecisionPage] = useState(1);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [bList, dList] = await Promise.all([
          bookingsApi.getAllAdmin(),
          bookingsApi.getAssignmentsAdmin(),
        ]);
        setBookings(bList || []);
        setDecisions(dList || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading admin operations console...
      </div>
    );
  }

  const totalRevenue = bookings.reduce(
    (acc, b) => acc + (b.priceSnapshot?.totalPaise || 0),
    0
  );

  const totalBookingPages = Math.ceil(bookings.length / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = bookings.slice(
    (bookingPage - 1) * ITEMS_PER_PAGE,
    bookingPage * ITEMS_PER_PAGE
  );

  const totalDecisionPages = Math.ceil(decisions.length / ITEMS_PER_PAGE) || 1;
  const paginatedDecisions = decisions.slice(
    (decisionPage - 1) * ITEMS_PER_PAGE,
    decisionPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Operations & Oversight
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin Console
        </h1>
        <p className="text-sm text-slate-500">
          System oversight, live bookings, and auto-assignment decisions.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Bookings
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {bookings.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Gross Volume
              </span>
              <p className="text-2xl font-extrabold text-emerald-600">
                {formatPaise(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Assignment Decisions
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {decisions.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* All Bookings Table Card */}
      <Card className="mb-8 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              All System Bookings
            </h2>
            <p className="text-xs text-slate-500">
              Showing {bookings.length > 0 ? (bookingPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
              {Math.min(bookingPage * ITEMS_PER_PAGE, bookings.length)} of {bookings.length}{' '}
              entries
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
            No bookings created yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Residence</th>
                    <th className="px-4 py-3">Slot Start</th>
                    <th className="px-4 py-3">Trainer ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedBookings.map((b) => (
                    <tr key={b._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {b._id.slice(-6)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {b.societyId ? b.societyId.name : 'Residence'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {new Date(b.startAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {b.trainerId ? b.trainerId.slice(-6) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                              ? 'emerald'
                              : b.status === 'CANCELLED' || b.status === 'EXPIRED'
                              ? 'rose'
                              : b.status === 'IN_PROGRESS' ||
                                b.status === 'ON_THE_WAY' ||
                                b.status === 'PENDING_PAYMENT'
                              ? 'amber'
                              : 'slate'
                          }
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                        {formatPaise(b.priceSnapshot?.totalPaise || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalBookingPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  Page {bookingPage} of {totalBookingPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setBookingPage((prev) => Math.max(prev - 1, 1))}
                    disabled={bookingPage === 1}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBookingPage((prev) => Math.min(prev + 1, totalBookingPages))
                    }
                    disabled={bookingPage === totalBookingPages}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Trainer Auto-Assignment Evaluation Log Card */}
      <Card className="p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trainer Auto-Assignment Evaluation Log
            </h2>
            <p className="text-xs text-slate-500">
              Showing {decisions.length > 0 ? (decisionPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
              {Math.min(decisionPage * ITEMS_PER_PAGE, decisions.length)} of {decisions.length}{' '}
              logs
            </p>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
            No assignment evaluation logs yet.
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedDecisions.map((d) => (
                <div
                  key={d._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300"
                >
                  {/* Log Header */}
                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          d.outcome === 'ASSIGNED'
                            ? 'bg-emerald-100/80 text-emerald-700'
                            : 'bg-rose-100/80 text-rose-700'
                        }`}
                      >
                        {d.outcome === 'ASSIGNED' ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {d.societyId ? d.societyId.name : 'Residence'}
                          </span>
                          <Badge tone={d.outcome === 'ASSIGNED' ? 'emerald' : 'rose'}>
                            {d.outcome}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Slot Time:{' '}
                          <span className="font-semibold text-slate-700">
                            {new Date(d.slotStart).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="font-mono text-xs text-slate-400 sm:text-right">
                      Log ID: {d._id.slice(-6)}
                    </div>
                  </div>

                  {/* Candidates List */}
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Evaluated Candidates ({d.candidates.length})
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {d.candidates.map((c) => {
                        const isChosen = c.trainerId === d.chosenTrainerId;
                        return (
                          <div
                            key={c.trainerId}
                            className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                              isChosen
                                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 shadow-xs'
                                : !c.eligible
                                ? 'border-slate-200 bg-slate-50/60 opacity-80'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            {isChosen && (
                              <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                                Selected Trainer
                              </span>
                            )}

                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    isChosen ? 'text-emerald-950' : 'text-slate-800'
                                  }`}
                                >
                                  {c.trainerName}
                                </span>
                                {!c.eligible && (
                                  <span className="shrink-0 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                    Ineligible
                                  </span>
                                )}
                              </div>

                              {/* Stat Pills */}
                              <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                                <div className="flex items-center gap-1 rounded-md bg-slate-100/70 px-2 py-1 text-slate-600">
                                  <span className="text-slate-400">📍</span>
                                  <span className="font-semibold">{c.distanceKm} km</span>
                                </div>
                                <div className="flex items-center gap-1 rounded-md bg-slate-100/70 px-2 py-1 text-slate-600">
                                  <span className="text-amber-500">★</span>
                                  <span className="font-semibold">{c.rating}</span>
                                </div>
                              </div>

                              <div className="mt-2 text-[11px] text-slate-500">
                                Sessions today:{' '}
                                <span className="font-semibold text-slate-700">
                                  {c.sessionsToday}
                                </span>
                              </div>
                            </div>

                            {!c.eligible && c.reason && (
                              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[11px] font-medium leading-tight text-rose-600">
                                {c.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Decisions Pagination Controls */}
            {totalDecisionPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  Page {decisionPage} of {totalDecisionPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDecisionPage((prev) => Math.max(prev - 1, 1))}
                    disabled={decisionPage === 1}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDecisionPage((prev) => Math.min(prev + 1, totalDecisionPages))
                    }
                    disabled={decisionPage === totalDecisionPages}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}