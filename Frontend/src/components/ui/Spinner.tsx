import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
    </svg>
  )
}

export function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-8 w-8 text-emerald-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}