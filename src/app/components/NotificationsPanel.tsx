import { Bell, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { Notification } from "../types/notification";
import { StatePanel } from "./shared/StatePanel";
import { getNotificationSeverityMeta } from "../lib/notificationMeta";
import { Badge } from "./ui/badge";

interface NotificationsPanelProps {
  notifications: Notification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Оповещения</h2>
          <p className="text-[13px] text-muted-foreground">
            Напоминания, сигналы риска и события, требующие внимания
          </p>
        </div>
        <button
          onClick={() => navigate("/notifications")}
          className="rounded-2xl px-3 py-2 text-[13px] text-primary transition-colors hover:bg-accent"
        >
          Вся лента
        </button>
      </div>

      {notifications.length === 0 ? (
        <StatePanel
          title="Лента пока пуста"
          description="Новые напоминания и системные сигналы появятся здесь, как только в прототипе возникнут события."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const severity = getNotificationSeverityMeta(notification.severity);

            return (
              <button
                key={notification.id}
                onClick={() => navigate(notification.action_url)}
                className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-accent/50 ${
                  notification.is_read
                    ? "border-border bg-card"
                    : severity.unreadClassName
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${severity.iconShellClassName}`}
                >
                  {notification.is_read ? (
                    <Bell className="size-4" />
                  ) : (
                    <BellRing className="size-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-[13px] font-medium text-foreground">
                      {notification.title}
                    </p>
                    <Badge
                      className={`rounded-[10px] px-2 py-0.5 text-[10px] ${severity.badgeClassName}`}
                    >
                      {severity.label}
                    </Badge>
                  </div>

                  <p className="mb-1 text-[11px] leading-5 text-muted-foreground">
                    {notification.body}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
