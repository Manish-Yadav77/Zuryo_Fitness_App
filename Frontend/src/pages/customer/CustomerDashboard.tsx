import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  MapPin,
  Dumbbell,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AiRecommendationCard } from '@/components/ai/AiRecommendationCard';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .getMine()
      .then((data) => setBookings(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) =>
    ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)
  );
  const completed = bookings.filter((b) => b.status === 'COMPLETED');

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12 text-sm text-slate-500">
        Loading your fitness dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Your Fitness Hub
          </span>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-500">
            Track your workouts, session schedule, and AI recommendations.
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4" /> Book Session
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Upcoming
              </span>
              <p className="text-2xl font-extrabold text-emerald-600">
                {upcoming.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Workouts Done
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {completed.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Dumbbell className="h-5 w-5" />
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
      </div>

      {/* AI Recommendation Widget */}
      <div className="mb-8">
        <AiRecommendationCard />
      </div>

      {/* Recent Bookings List */}
      <Card className="p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Sessions</h2>
            <p className="text-xs text-slate-500">
              Your latest doorstep workout bookings and statuses.
            </p>
          </div>
          <Link
            to="/customer/bookings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
            No sessions booked yet. Click "Book Session" above to schedule your first workout!
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/customer/bookings/${b._id}`} className="block">
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {b.societyId ? b.societyId.name : 'Residence'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-6 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {new Date(b.startAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="self-start pl-6 sm:self-center sm:pl-0">
                    <Badge
                      tone={
                        b.status === 'CONFIRMED'
                          ? 'emerald'
                          : b.status === 'IN_PROGRESS'
                          ? 'amber'
                          : b.status === 'CANCELLED'
                          ? 'rose'
                          : 'slate'
                      }
                    >
                      {b.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}