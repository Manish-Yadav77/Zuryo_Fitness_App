import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { parseApiError } from '@/api/client'
import { loginSchema, zodFieldErrors } from '@/lib/validation'
import type { FieldErrors } from '@/lib/validation'
import { roleHome } from '@/config/nav'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Demo accounts created by `npm run seed` in the backend (synthetic data only).
const DEMO_PASSWORD = 'Demo@12345'
const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'customer@demo.test' },
  { label: 'Trainer', email: 'trainer1@demo.test' },
  { label: 'Admin', email: 'admin@demo.test' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error))
      return
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      const user = await login(result.data)
      navigate(roleHome[user.role], { replace: true })
    } catch (err) {
      const parsed = parseApiError(err)
      setFormError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to book sessions and track your fitness journey.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <Button type="submit" fullWidth loading={submitting}>
          Log in
        </Button>
      </form>

      <div className="mt-8 rounded-2xl bg-slate-100/70 p-4 ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <p className="mt-1 text-xs text-slate-500">Click to fill the form, then press Log in.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setEmail(acc.email)
                setPassword(DEMO_PASSWORD)
                setFieldErrors({})
                setFormError(null)
              }}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-300"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        New to Zuryo Fit?{' '}
        <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}