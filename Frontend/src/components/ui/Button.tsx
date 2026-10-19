import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:outline-emerald-600',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}