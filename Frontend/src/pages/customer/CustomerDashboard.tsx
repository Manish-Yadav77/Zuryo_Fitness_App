import { CalendarCheck, CheckCircle2, Dumbbell, Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { firstName, getGreeting } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export default function CustomerDashboard() {
  const { user } = useAuth()
  if (!user) return null

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

      <Card className="mt-6 flex flex-col items-start gap-4 bg-linear-to-br from-emerald-600 to-teal-600 text-white ring-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Dumbbell className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Book a trainer</h2>
            <p className="mt-1 max-w-md text-sm text-emerald-50/90">
              Instant or scheduled 60-minute sessions in your community. Booking opens in an upcoming phase.
            </p>
          </div>
        </div>
        <Button variant="secondary" disabled>
          Coming soon
        </Button>
      </Card>

      <Card className="mt-6">
        <h2 className="text-base font-semibold text-slate-900">Your account</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-0.5 truncate font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-900">{user.role}</dd>
          </div>
        </dl>
      </Card>
    </>
  )
}
