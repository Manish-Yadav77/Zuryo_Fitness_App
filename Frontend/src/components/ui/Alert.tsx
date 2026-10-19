import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'error' | 'success' | 'info'

const tones: Record<Tone, string> = {
  error: 'bg-rose-50 text-rose-800 ring-rose-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
}

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl px-4 py-3 text-sm ring-1 ring-inset', tones[tone])}>
      {children}
    </div>
  )
}