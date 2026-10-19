import { CalendarClock, CalendarDays, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { firstName, getGreeting } from '@/lib/format'
import { Card, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export default function TrainerDashboard() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName(user.name)}`}
        subtitle="Your sessions and availability will appear here."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Today's sessions" value="-" caption="Assigned sessions arrive in a later phase" icon={CalendarClock} />
        <StatCard label="This week" value="-" caption="Schedule arrives in a later phase" icon={CalendarDays} />
        <StatCard label="Rating" value="-" caption="Feedback arrives in a later phase" icon={Star} />
      </div>

      <Card className="mt-6 text-center">
        <p className="py-8 text-sm text-slate-500">No sessions assigned yet.</p>
      </Card>
    </>
  )
}