import type { ReactNode } from 'react'
import { CalendarClock, MapPin, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const features = [
  { icon: CalendarClock, title: 'Instant or scheduled', text: 'Book a 60-minute session within the hour or pick a slot that suits you.' },
  { icon: MapPin, title: 'Trainers in your society', text: 'Certified trainers matched by availability and location.' },
  { icon: ShieldCheck, title: 'Clear, honest pricing', text: 'See the full price breakdown before you pay.' },
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-emerald-700 via-emerald-600 to-teal-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

        <Logo light className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Your trainer, at your doorstep.</h2>
          <p className="mt-4 text-emerald-50/90">
            On-demand fitness sessions for your residential community. No commute, no memberships.
          </p>
          <ul className="mt-10 space-y-6">
            {features.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-emerald-50/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/70">Assignment MVP - synthetic demo data only</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}