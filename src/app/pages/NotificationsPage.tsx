import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { StatePanel } from "../components/shared/StatePanel";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { getNotifications } from "../services/notificationsService";
import { getNotificationSeverityMeta } from "../lib/notificationMeta";
import { Notification, NotificationSeverity } from "../types/notification";

const PAGE_SIZE = 12;

type ReadFilter = "all" | "read" | "unread";
type SeverityFilter = "all" | NotificationSeverity;

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    bootstrapError,
    isBootstrapping,
    markAllRead,
    markNotificationRead,
    notifications,
    retryBootstrap,
    unreadCount,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const apiFilters = useMemo(() => {
    return {
      page: 1,
      size: PAGE_SIZE,
      search: search.trim() || undefined,
      is_read:
        readFilter === "all" ? null : readFilter === "read",
      severity: severityFilter === "all" ? null : severityFilter,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    };
  }, [from, readFilter, search, severityFilter, to]);

  const loadPage = useCallback(
    async (targetPage: number, replace = false) => {
      if (replace) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const response = await getNotifications({
          ...apiFilters,
          page: targetPage,
        });

        setItems((current) => {
          if (replace) {
            return response.items;
          }

          const known = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...response.items.filter((item) => !known.has(item.id)),
          ];
        });
        setPage(targetPage);
        setHasMore(targetPage < response.pagination.total_pages);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить уведомления",
        );
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [apiFilters],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage, notifications]);

  useEffect(() => {
    if (loadingInitial || loadingMore || !hasMore || !sentinelRef.current) {
      return;
    }

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPage(page + 1);
        }
      },
      {
        rootMargin: "160px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadPage, loadingInitial, loadingMore, page]);

  async function handleNotificationClick(notification: Notification) {
    await markNotificationRead(notification.id);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  }

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="Не удалось загрузить уведомления"
          description={bootstrapError}
          actionLabel="Повторить"
          onAction={() => {
            void retryBootstrap();
          }}
        />
      </main>
    );
  }

  if (isBootstrapping) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-xl" />
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-[14px]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-foreground">
              Мои уведомления
            </h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} непрочитанных`
                : "Все уведомления просмотрены"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 ? (
              <Button
                className="rounded-[10px]"
                onClick={() => {
                  void markAllRead();
                }}
              >
                Отметить все как прочитанные
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-[14px] border border-border bg-card p-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,180px))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Поиск по заголовку и тексту"
            />
          </div>

          <Select
            value={readFilter}
            onValueChange={(value: ReadFilter) => setReadFilter(value)}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="unread">Непрочитанные</SelectItem>
              <SelectItem value="read">Прочитанные</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={severityFilter}
            onValueChange={(value: SeverityFilter) => setSeverityFilter(value)}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue placeholder="Критичность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="CRITICAL">Критично</SelectItem>
              <SelectItem value="HIGH">Высокий</SelectItem>
              <SelectItem value="NORMAL">Обычный</SelectItem>
              <SelectItem value="LOW">Низкий</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />

          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        {loadingInitial ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-[14px]" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            variant="error"
            title="Не удалось открыть ленту"
            description={error}
            actionLabel="Попробовать снова"
            onAction={() => {
              void loadPage(1, true);
            }}
          />
        ) : items.length === 0 ? (
          <StatePanel
            title="Нет уведомлений"
            description="По текущим фильтрам ничего не найдено. Попробуйте изменить период, статус или строку поиска."
          />
        ) : (
          <div className="space-y-3">
            {items.map((notification) => {
              const severity = getNotificationSeverityMeta(notification.severity);
              const Icon = severity.icon;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    void handleNotificationClick(notification);
                  }}
                  className={`w-full rounded-[14px] border p-4 text-left transition-colors hover:bg-accent/40 ${
                    notification.is_read
                      ? "border-border bg-card"
                      : severity.unreadClassName
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] ${severity.iconShellClassName}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {notification.title}
                        </p>

                        {!notification.is_read ? (
                          <span className="size-2 rounded-full bg-primary" />
                        ) : null}

                        <Badge
                          className={`rounded-[10px] px-2 py-0.5 text-[10px] ${severity.badgeClassName}`}
                        >
                          {severity.label}
                        </Badge>
                      </div>

                      <p className="mb-3 text-sm leading-6 text-muted-foreground">
                        {notification.body}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Bell className="size-3.5" />
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                              locale: ru,
                            },
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {notification.is_read ? "Прочитано" : "Ожидает просмотра"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            <div ref={sentinelRef} className="h-3" />

            {loadingMore ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-[14px]" />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
