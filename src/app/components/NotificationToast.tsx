import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router";
import { Notification } from "../types/notification";
import { getNotificationSeverityMeta } from "../lib/notificationMeta";
import { Badge } from "./ui/badge";

interface NotificationToastProps {
  notification: Notification;
  onRead: (notificationId: string) => Promise<void>;
  onDismiss: () => void;
}

export function NotificationToast({
  notification,
  onRead,
  onDismiss,
}: NotificationToastProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const severity = getNotificationSeverityMeta(notification.severity);
  const Icon = severity.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss();
    }, notification.display_duration * 1000);

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (rootRef.current?.contains(target)) {
        return;
      }

      onDismiss();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [notification.display_duration, onDismiss]);

  async function handleOpen() {
    await onRead(notification.id);
    onDismiss();

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-6 right-6 z-[60] w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-[14px] border backdrop-blur ${severity.toastClassName}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[10px] ${severity.iconShellClassName}`}
        >
          <Icon className="size-4" />
        </div>

        <button
          type="button"
          onClick={() => {
            void handleOpen();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <div className="mb-2 flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {notification.title}
            </p>
            <Badge className={`rounded-[10px] px-2 py-0.5 text-[10px] ${severity.badgeClassName}`}>
              {severity.label}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {notification.body}
          </p>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-[10px] p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Закрыть уведомление"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
