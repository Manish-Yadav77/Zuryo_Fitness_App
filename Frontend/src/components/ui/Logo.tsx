import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          light ? 'bg-white/15 text-white ring-1 ring-white/30' : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
        )}
      >
        <Dumbbell className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        Zuryo <span className={light ? 'text-emerald-200' : 'text-emerald-600'}>Fit</span>
      </span>
    </div>
  )
}