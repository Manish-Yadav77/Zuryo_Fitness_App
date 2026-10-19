import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { notificationsApi } from '@/api/notifications.api';
import type { AppNotification } from '@/types/notification';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notificationsApi.getMine().then(setNotifications).catch(console.error);
    const interval = setInterval(() => {
      notificationsApi.getMine().then(setNotifications).catch(console.error);
    }, 10000); // Poll notifications every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkRead(id: string) {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            <span className="text-xs text-slate-500">{unreadCount} unread</span>
          </div>

          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start justify-between rounded-xl p-2.5 text-xs transition ${
                    n.readAt ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50/60 text-slate-900 font-medium'
                  }`}
                >
                  <div>
                    <p>{n.message}</p>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                      title="Mark read"
                    >
                      <Check className="h-3.5 w-3.5" />
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