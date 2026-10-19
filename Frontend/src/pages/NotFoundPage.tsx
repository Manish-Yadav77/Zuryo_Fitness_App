import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <p className="text-6xl font-bold tracking-tight text-slate-900">404</p>
      <p className="text-slate-500">We could not find that page.</p>
      <Link to="/" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
        Go home
      </Link>
    </div>
  )
}