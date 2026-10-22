import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/api/notifications.api';
import type { AppNotification } from '@/types/notification';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialFetch = useRef(true);
  const previousIds = useRef<Set<string>>(new Set());

  const playBuzzerSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1174.66, now + 0.18);
      gain2.gain.setValueAtTime(0.2, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.4);
    } catch {
      // Audio play can be silently blocked if user hasn't interacted with the page yet
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = () => {
      notificationsApi
        .getMine()
        .then((data) => {
          if (!isMounted) return;
          const newNotifications = data || [];

          if (isInitialFetch.current) {
            isInitialFetch.current = false;
            previousIds.current = new Set(newNotifications.map((n) => n._id));
          } else {
            const hasNewUnread = newNotifications.some(
              (n) => !n.readAt && !previousIds.current.has(n._id)
            );

            if (hasNewUnread) {
              playBuzzerSound();
            }

            previousIds.current = new Set(newNotifications.map((n) => n._id));
          }

          setNotifications(newNotifications);
        })
        .catch(console.error);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map((n) => notificationsApi.markRead(n._id)));
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto pr-0.5">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start justify-between gap-2 rounded-xl p-2.5 text-xs transition ${
                    n.readAt
                      ? 'bg-slate-50 text-slate-500'
                      : 'bg-emerald-50/60 font-medium text-slate-900 ring-1 ring-emerald-500/10'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="leading-snug">{n.message}</p>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="mt-0.5 shrink-0 text-emerald-600 transition hover:text-emerald-800"
                      title="Mark read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}