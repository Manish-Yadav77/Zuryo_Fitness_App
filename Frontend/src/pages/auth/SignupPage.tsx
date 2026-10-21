import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/api/client';
import { signupSchema, zodFieldErrors } from '@/lib/validation';
import type { FieldErrors } from '@/lib/validation';
import { roleHome } from '@/config/nav';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const result = signupSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const { name: n, email: em, password: pw } = result.data;
      const user = await signup({ name: n, email: em, password: pw });
      navigate(roleHome[user.role], { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setFormError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  }

  const togglePasswordVisibility = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      className="rounded-lg p-1.5 text-slate-400 transition hover:text-slate-600"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join in a minute. You will set up your fitness profile next."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8+ characters with at least one letter and one number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          trailing={togglePasswordVisibility}
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={submitting} className="py-2.5 font-bold">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-emerald-600 hover:text-emerald-700"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}