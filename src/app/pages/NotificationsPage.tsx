import { useMemo, useState } from "react";
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

export function NotificationsPage() {
  const navigate = useNavigate();
  const { bootstrapError, isBootstrapping, markAllRead, markNotificationRead, notifications, retryBootstrap, unreadCount } = useAppData();
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");

  const filteredNotifications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return notifications
      .filter((item) => readFilter === "all" || (readFilter === "read" ? item.is_read : !item.is_read))
      .filter((item) => !needle || [item.title, item.body].join(" ").toLowerCase().includes(needle));
  }, [notifications, readFilter, search]);

  if (bootstrapError) {
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить уведомления" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-5xl p-6"><div className="space-y-2"><Skeleton className="h-8 w-56 rounded-xl" /><Skeleton className="h-4 w-64 rounded-xl" /></div><div className="mt-6 space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}</div></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="mb-1 text-2xl font-semibold text-foreground">Уведомления</h1><p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} непрочитанных` : "Все уведомления прочитаны"}</p></div>
          {unreadCount > 0 ? <Button className="rounded-2xl" onClick={() => { void markAllRead(); }}>Прочитать все</Button> : null}
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Поиск по заголовку или тексту" /></div>
          <Select value={readFilter} onValueChange={(value: "all" | "read" | "unread") => setReadFilter(value)}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все</SelectItem><SelectItem value="unread">Непрочитанные</SelectItem><SelectItem value="read">Прочитанные</SelectItem></SelectContent></Select>
        </div>

        {filteredNotifications.length === 0 ? (
          <StatePanel title="Нет уведомлений" description="По текущим фильтрам ничего не найдено." />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  void markNotificationRead(notification.id);
                  navigate(notification.action_url);
                }}
                className={`w-full rounded-3xl border p-5 text-left transition-colors hover:bg-accent/50 ${notification.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
              >
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2"><p className="font-medium text-foreground">{notification.title}</p>{!notification.is_read ? <span className="size-2 rounded-full bg-primary" /> : null}</div>
                    <p className="mb-2 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ru })}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
