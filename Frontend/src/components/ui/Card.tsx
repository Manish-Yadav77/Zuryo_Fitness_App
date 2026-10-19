import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200', className)} {...rest} />
}

interface StatCardProps {
  label: string
  value: ReactNode
  caption?: string
  icon: LucideIcon
}

export function StatCard({ label, value, caption, icon: Icon }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </Card>
  )
}