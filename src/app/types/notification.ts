export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface Notification {
  id: string;
  title: string;
  body: string;
  action_url: string;
  severity: NotificationSeverity;
  display_duration: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  items: Notification[];
  pagination: {
    page: number;
    size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface NotificationFilters {
  is_read?: boolean | null;
  severity?: NotificationSeverity | null;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface WebSocketMessage {
  type: 'NEW_NOTIFICATION';
  payload: Notification;
}
