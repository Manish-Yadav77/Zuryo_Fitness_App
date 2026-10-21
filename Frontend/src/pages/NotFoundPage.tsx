import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Home } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50/60 px-6 py-12">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-200/40 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200/80 sm:p-10">
        <Logo />

        {/* Playful Icon Badge */}
        <div className="my-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-2xs ring-1 ring-emerald-200/70">
          <Dumbbell className="h-10 w-10 -rotate-12 transition-transform duration-300 hover:rotate-0" />
        </div>

        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl">
          404
        </span>

        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
          Lost your workout track?
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
          The page you're looking for doesn't exist, was moved, or skipped gym day today.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:from-emerald-700 hover:to-teal-700"
          >
            <Home className="h-4 w-4" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}