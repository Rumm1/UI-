import { Bell, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { Notification } from "../types/notification";
import { StatePanel } from "./shared/StatePanel";

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
            Последние системные события и действия пользователя
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
          title="Нет событий"
          description="Когда в системе появятся новые действия или оповещения, они отобразятся здесь."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => navigate(notification.action_url)}
              className="flex w-full gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {notification.is_read ? (
                  <Bell className="size-4" />
                ) : (
                  <BellRing className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[13px] font-medium text-foreground">
                  {notification.title}
                </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
