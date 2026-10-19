import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.getMine()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-slate-500">Loading bookings...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500">Manage your current and past workout sessions.</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No bookings found.</p>
          <Link to="/customer/book" className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Book a workout session
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b._id} to={`/customer/bookings/${b._id}`}>
              <Card className="flex items-center justify-between transition hover:border-emerald-300">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{b.societyId ? b.societyId.name : 'Society'}</span>
                    <Badge tone={b.status === 'CONFIRMED' ? 'emerald' : 'slate'}>{b.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(b.startAt).toLocaleString()} ({b.mode})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{formatPaise(b.priceSnapshot.totalPaise)}</span>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}