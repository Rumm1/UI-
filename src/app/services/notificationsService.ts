import {
  getNotifications as getNotificationsFromStore,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  pushNotification,
  subscribeToNotificationMessages,
} from "./prototypeApi";
import {
  Notification,
  NotificationFilters,
  NotificationsResponse,
  WebSocketMessage,
} from "../types/notification";

export const NOTIFICATIONS_WS_URL =
  "/ws/v1/system-services/notification/notifications";
export const NOTIFICATIONS_REST_BASE =
  "/api/v1/system-services/notification/notifications";

export async function getNotifications(
  filters?: NotificationFilters,
): Promise<NotificationsResponse> {
  return getNotificationsFromStore(filters);
}

export async function getUnreadCount(): Promise<number> {
  return getUnreadNotificationsCount();
}

export async function markAsRead(id: string) {
  await markNotificationAsRead(id);
}

export async function markAllAsRead() {
  await markAllNotificationsAsRead();
}

export async function createNotification(input: {
  title: string;
  body: string;
  actionUrl: string;
  severity?: Notification["severity"];
  displayDuration?: number;
}) {
  return pushNotification(input);
}

export function connectNotificationsSocket(handlers: {
  onMessage: (message: WebSocketMessage) => void;
  onReconnect?: () => void;
}) {
  let closed = false;
  let unsubscribe = () => {};
  let reconnectTimer: number | null = null;

  const connect = () => {
    unsubscribe = subscribeToNotificationMessages((message) => {
      handlers.onMessage(message);
    });

    void handlers.onReconnect?.();
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimer !== null) {
      return;
    }

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 5000);
  };

  connect();

  return {
    url: NOTIFICATIONS_WS_URL,
    reconnect: scheduleReconnect,
    close() {
      closed = true;
      unsubscribe();

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
    },
  };
}
