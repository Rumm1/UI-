import { useState } from "react";
import { Bell, Check, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markNotificationRead } = useAppData();
  const [open, setOpen] = useState(false);

  const visibleNotifications = notifications.slice(0, 6);

  async function handleNotificationClick(notificationId: string, actionUrl: string) {
    await markNotificationRead(notificationId);
    setOpen(false);
    navigate(actionUrl);
  }

  async function handleMarkAll() {
    await markAllRead();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-2xl p-2 transition-colors hover:bg-accent"
        aria-label="Уведомления"
      >
        <Bell className="size-5 text-foreground" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Уведомления</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} непрочитанных` : "Все прочитано"}
                </p>
              </div>
              {unreadCount > 0 ? (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-primary transition-colors hover:bg-accent"
                >
                  <Check className="size-3.5" />
                  Прочитать все
                </button>
              ) : null}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {visibleNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.action_url)
                  }
                  className={`w-full border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/60 ${
                    notification.is_read ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    {!notification.is_read ? (
                      <span className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mb-2 text-xs leading-5 text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </button>
              ))}
            </div>

            <div className="border-t border-border p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="flex w-full items-center justify-center gap-1 rounded-2xl px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
              >
                Все уведомления
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
