import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {  PlusCircle} from 'lucide-react';
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
    bookingsApi.getMine()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');

  if (loading) return <div className="py-10 text-center text-slate-500">Loading your fitness dashboard...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-500">Track your workouts and personalized AI recommendations.</p>
        </div>
        <Link
          to="/customer/book"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4" /> Book Session
        </Link>
      </div>

      {/* Metrics Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Upcoming Sessions</span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{upcoming.length}</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Workouts Completed</span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{completed.length}</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Bookings</span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{bookings.length}</p>
        </Card>
      </div>

      {/* AI Recommendation Generator Widget */}
      <AiRecommendationCard />

      {/* Recent Bookings List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Sessions</h2>
          <Link to="/customer/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            View All
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No sessions booked yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/customer/bookings/${b._id}`}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-emerald-300">
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{b.societyId ? b.societyId.name : 'Residence'}</span>
                    <p className="text-xs text-slate-500">{new Date(b.startAt).toLocaleString()}</p>
                  </div>
                  <Badge tone={b.status === 'CONFIRMED' ? 'emerald' : 'slate'}>{b.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}