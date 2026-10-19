import { ClipboardList, TriangleAlert, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { firstName, getGreeting } from '@/lib/format'
import { Card, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export default function AdminDashboard() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName(user.name)}`}
        subtitle="Operations overview: bookings, assignments, pricing and session status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Bookings today" value="-" caption="Bookings arrive in a later phase" icon={ClipboardList} />
        <StatCard label="Active trainers" value="-" caption="Trainer data arrives in a later phase" icon={Users} />
        <StatCard label="Unfulfilled requests" value="-" caption="Assignment log arrives in a later phase" icon={TriangleAlert} />
      </div>

      <Card className="mt-6 text-center">
        <p className="py-8 text-sm text-slate-500">Booking, assignment and pricing tables will appear here.</p>
      </Card>
    </>
  )
}