import { useEffect, useRef, useState } from "react";
import { Bell, Check, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { getNotifications } from "../services/notificationsService";
import { Notification } from "../types/notification";
import { getNotificationSeverityMeta } from "../lib/notificationMeta";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markNotificationRead } =
    useAppData();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (rootRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadLatestNotifications() {
      setLoading(true);
      setError(null);

      try {
        const response = await getNotifications({
          page: 1,
          size: 6,
        });

        if (!cancelled) {
          setItems(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить уведомления",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLatestNotifications();

    return () => {
      cancelled = true;
    };
  }, [notifications, open]);

  async function handleNotificationClick(notification: Notification) {
    await markNotificationRead(notification.id);
    setOpen(false);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  }

  async function handleMarkAll() {
    await markAllRead();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-[10px] p-2 transition-colors hover:bg-accent"
        aria-label="Уведомления"
      >
        <Bell className="size-5 text-foreground" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white dark:bg-rose-900/90 dark:text-rose-100">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[380px] overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_30px_60px_-32px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Уведомления</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} непрочитанных`
                  : "Новых уведомлений нет"}
              </p>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAll();
                }}
                className="flex items-center gap-1 rounded-[10px] px-2 py-1 text-xs text-primary transition-colors hover:bg-accent"
              >
                <Check className="size-3.5" />
                Прочитать все
              </button>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-[10px]" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-destructive">{error}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  Лента пуста
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Новые напоминания и системные сигналы появятся здесь.
                </p>
              </div>
            ) : (
              items.map((notification) => {
                const severity = getNotificationSeverityMeta(
                  notification.severity,
                );
                const Icon = severity.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      void handleNotificationClick(notification);
                    }}
                    className={`w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/40 ${
                      notification.is_read
                        ? "border-border bg-card"
                        : severity.unreadClassName
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[10px] ${severity.iconShellClassName}`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          {!notification.is_read ? (
                            <span className="size-2 rounded-full bg-primary" />
                          ) : null}
                        </div>

                        <p className="mb-2 text-xs leading-5 text-muted-foreground">
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              {
                                addSuffix: true,
                                locale: ru,
                              },
                            )}
                          </p>
                          <Badge
                            className={`rounded-[10px] px-2 py-0.5 text-[10px] ${severity.badgeClassName}`}
                          >
                            {severity.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="flex w-full items-center justify-center gap-1 rounded-[10px] px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
            >
              Мои уведомления
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
