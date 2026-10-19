import { useEffect, useState } from 'react';
import { bookingsApi } from '@/api/bookings.api';
import type { AssignmentDecisionDoc } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [decisions, setDecisions] = useState<AssignmentDecisionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [bList, dList] = await Promise.all([
          bookingsApi.getAllAdmin(),
          bookingsApi.getAssignmentsAdmin(),
        ]);
        setBookings(bList);
        setDecisions(dList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) return <div className="py-10 text-center text-slate-500">Loading admin operations console...</div>;

  const totalRevenue = bookings.reduce((acc, b) => acc + (b.priceSnapshot?.totalPaise || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Console</h1>
        <p className="text-sm text-slate-500">System oversight, live bookings, and auto-assignment decisions.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Bookings</span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{bookings.length}</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Gross Volume</span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{formatPaise(totalRevenue)}</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Assignment Decisions</span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{decisions.length}</p>
        </Card>
      </div>

      {/* All Bookings Table */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">All System Bookings</h2>
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No bookings created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Residence</th>
                  <th className="px-3 py-2">Slot Start</th>
                  <th className="px-3 py-2">Trainer ID</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{b._id.slice(-6)}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{b.societyId ? b.societyId.name : 'Residence'}</td>
                    <td className="px-3 py-2.5">{new Date(b.startAt).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono">{b.trainerId ? b.trainerId.slice(-6) : '-'}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={b.status === 'CONFIRMED' ? 'emerald' : b.status === 'CANCELLED' ? 'rose' : 'slate'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{formatPaise(b.priceSnapshot.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Auto-Assignment Decisions Log */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Trainer Auto-Assignment Evaluation Log</h2>
        {decisions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No assignment evaluation logs yet.</p>
        ) : (
          <div className="space-y-4">
            {decisions.map((d) => (
              <div key={d._id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Slot: {new Date(d.slotStart).toLocaleString()} ({d.societyId ? d.societyId.name : 'Residence'})
                  </span>
                  <Badge tone={d.outcome === 'ASSIGNED' ? 'emerald' : 'rose'}>{d.outcome}</Badge>
                </div>

                <div className="mt-3 space-y-1">
                  <span className="font-medium text-slate-700">Evaluated Candidates:</span>
                  <div className="grid gap-2 sm:grid-cols-2 mt-1">
                    {d.candidates.map((c) => (
                      <div
                        key={c.trainerId}
                        className={`rounded-lg p-2 border ${
                          c.trainerId === d.chosenTrainerId
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{c.trainerName}</span>
                          <span>{c.distanceKm} km away</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Rating: {c.rating} | Sessions today: {c.sessionsToday}
                        </p>
                        {!c.eligible && <p className="mt-1 text-[11px] font-semibold text-rose-600">Reason: {c.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}