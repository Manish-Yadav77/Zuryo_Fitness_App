import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  label: string
  error?: string
  hint?: string
  /** Element shown inside the input on the right, e.g. a show/hide password button */
  trailing?: ReactNode
}

export function Input({ label, error, hint, trailing, id, className, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-msg`

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
            'placeholder:text-slate-400 focus:ring-4',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
            trailing ? 'pr-11' : false,
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn('mt-1.5 text-xs', error ? 'text-rose-600' : 'text-slate-500')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}