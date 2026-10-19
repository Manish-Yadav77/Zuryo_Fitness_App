import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { formatPaise } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    bookingsApi.getById(id)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-10 text-center text-slate-500">Loading booking...</div>;
  if (!booking) return <div className="py-10 text-center text-slate-500">Booking not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed</h1>
          <p className="text-sm text-slate-500">Reference: {booking._id}</p>
        </div>
        <Badge tone="emerald">{booking.status}</Badge>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-3 text-slate-700">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">{booking.societyId ? booking.societyId.name : 'Society'}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-700">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <span>{new Date(booking.startAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Trainer Assigned Automatically</span>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Payment Breakdown</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Session Fee</span>
            <span>{formatPaise(booking.priceSnapshot.sessionPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span>Society Commission ({booking.priceSnapshot.commissionPercent}%)</span>
            <span>{formatPaise(booking.priceSnapshot.commissionPaise)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Total</span>
            <span className="text-emerald-700">{formatPaise(booking.priceSnapshot.totalPaise)}</span>
          </div>
        </div>
      </Card>

      <Link to="/customer/bookings" className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
        &larr; Return to my bookings
      </Link>
    </div>
  );
}