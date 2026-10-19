import { useEffect, useState } from 'react';
import { Calendar, MapPin,  UserCheck } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import type { Booking } from '@/types/booking';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SessionTimerCard } from '@/components/session/SessionTimerCard';

export default function TrainerDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  function loadSessions() {
    bookingsApi.getAssigned()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) return <div className="py-10 text-center text-slate-500">Loading assigned sessions...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trainer Dashboard</h1>
        <p className="text-sm text-slate-500">Manage your assigned doorstep workouts and live timers.</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="py-12 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No workout sessions assigned yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b._id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span>{b.societyId ? b.societyId.name : 'Residence'}</span>
                </div>
                <Badge tone={b.status === 'CONFIRMED' ? 'emerald' : b.status === 'IN_PROGRESS' ? 'amber' : 'slate'}>
                  {b.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{new Date(b.startAt).toLocaleString()} ({b.mode})</span>
              </div>

              <SessionTimerCard
                bookingId={b._id}
                isTrainer={true}
                bookingStatus={b.status}
                onStatusChange={loadSessions}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}