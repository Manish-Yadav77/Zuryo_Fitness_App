import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { navByRole, roleLabel } from '@/config/nav';
import { cn } from '@/lib/cn';
import { NotificationBell } from './NotificationBell';

export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!user) return null;
  const items = navByRole[user.role] || [];
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-900'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="border-t border-slate-200/80 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 shadow-2xs">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs font-medium text-slate-500">
              {roleLabel[user.role]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 shadow-2xs backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo className="lg:hidden" />
          </div>

          <NotificationBell />
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}