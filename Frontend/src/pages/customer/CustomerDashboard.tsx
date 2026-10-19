import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, ClipboardList, Dumbbell, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firstName, getGreeting } from '@/lib/format';
import { assessmentApi } from '@/api/assessment.api';
import type { FitnessAssessment } from '@/types/assessment';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<FitnessAssessment | null>(null);

  useEffect(() => {
    assessmentApi.getMine().then((data) => {
      setAssessment(data.assessment);
    }).catch(console.error);
  }, []);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName(user.name)}`}
        subtitle="Here is a quick look at your fitness journey."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Sessions remaining" value="-" caption="Packages arrive in a later phase" icon={Wallet} />
        <StatCard label="Upcoming bookings" value="-" caption="Booking arrives in a later phase" icon={CalendarCheck} />
        <StatCard label="Completed sessions" value="-" caption="History arrives in a later phase" icon={CheckCircle2} />
      </div>

      {!assessment ? (
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Complete your Fitness Assessment</h3>
                <p className="mt-0.5 text-xs text-slate-600">Tell us your age, weight, and fitness goals to help trainers tailor your sessions.</p>
              </div>
            </div>
            <Link to="/customer/assessment">
              <Button variant="primary">Start Assessment</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900">Your Fitness Profile Summary</h3>
            <Badge tone="emerald">Version {assessment.version}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Level</p>
              <p className="font-medium capitalize text-slate-900">{assessment.level}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Weight & Age</p>
              <p className="font-medium text-slate-900">{assessment.weightKg} kg, {assessment.age} yrs</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Primary Goals</p>
              <p className="font-medium text-slate-900">{assessment.goals.join(', ')}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-6 flex flex-col items-start gap-4 bg-linear-to-br from-emerald-600 to-teal-600 text-white ring-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Dumbbell className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Book a trainer</h2>
            <p className="mt-1 max-w-md text-sm text-emerald-50/90">
              Instant or scheduled 60-minute sessions in your community. Booking opens in Phase 4.
            </p>
          </div>
        </div>
        <Button variant="secondary" disabled>
          Coming soon
        </Button>
      </Card>
    </>
  );
}